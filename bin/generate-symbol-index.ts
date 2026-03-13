#!/usr/bin/env npx tsx
import * as fs from 'fs';
import * as path from 'path';
import ts from 'typescript';

interface SymbolEntry {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'const' | 'variable' | 'enum' | 'method' | 'property';
  file: string;
  line: number;
  exported: boolean;
  signature?: string;
  jsdoc?: string;
  parent?: string;
}

interface FileEntry {
  path: string;
  exports: string[];
  imports: string[];
}

interface IndexOutput {
  generated: string;
  projectRoot: string;
  stats: {
    filesIndexed: number;
    symbolsFound: number;
    exportedSymbols: number;
  };
  symbols: SymbolEntry[];
  files: FileEntry[];
}

// --- Argument parsing ---

const args = process.argv.slice(2);
const parsed: Record<string, string> = {};

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--') && i + 1 < args.length && !args[i + 1].startsWith('--')) {
    parsed[args[i].slice(2)] = args[i + 1];
    i++;
  }
}

const srcDir = parsed['src'] || './src';
const outputPath = parsed['output'] || '.claude/index/symbols.json';
const excludePatterns = (parsed['exclude'] || 'node_modules,dist,build,.git,*.test.ts,*.spec.ts').split(',');

// --- Main ---

console.log(`Indexing ${srcDir}...`);

if (!fs.existsSync(srcDir)) {
  console.log(`Source directory ${srcDir} not found. Creating empty index.`);
  const emptyOutput: IndexOutput = {
    generated: new Date().toISOString(),
    projectRoot: process.cwd(),
    stats: { filesIndexed: 0, symbolsFound: 0, exportedSymbols: 0 },
    symbols: [],
    files: []
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(emptyOutput, null, 2));
  process.exit(0);
}

const files = findFiles(srcDir, excludePatterns);
const allSymbols: SymbolEntry[] = [];
const allFiles: FileEntry[] = [];
const projectRoot = process.cwd();

for (const file of files) {
  try {
    const { symbols, fileEntry } = parseFile(file, projectRoot);
    allSymbols.push(...symbols);
    allFiles.push(fileEntry);
  } catch {
    console.warn(`Warning: Failed to parse ${file}`);
  }
}

const output: IndexOutput = {
  generated: new Date().toISOString(),
  projectRoot,
  stats: {
    filesIndexed: files.length,
    symbolsFound: allSymbols.length,
    exportedSymbols: allSymbols.filter(s => s.exported).length
  },
  symbols: allSymbols.sort((a, b) => a.name.localeCompare(b.name)),
  files: allFiles.sort((a, b) => a.path.localeCompare(b.path))
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\nIndex complete:`);
console.log(`  Files indexed: ${output.stats.filesIndexed}`);
console.log(`  Symbols found: ${output.stats.symbolsFound}`);
console.log(`  Exported symbols: ${output.stats.exportedSymbols}`);
console.log(`\nOutput: ${outputPath}`);

// --- Implementation ---

function findFiles(dir: string, excludePatterns: string[]): string[] {
  const fileList: string[] = [];

  function shouldExclude(filePath: string): boolean {
    return excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  function walk(currentDir: string): void {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (shouldExclude(fullPath)) continue;

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        fileList.push(fullPath);
      }
    }
  }

  walk(dir);
  return fileList;
}

function getJSDoc(node: ts.Node, sourceFile: ts.SourceFile): string | undefined {
  const jsDocNodes = (node as any).jsDoc as ts.JSDoc[] | undefined;
  if (jsDocNodes && jsDocNodes.length > 0) {
    const comment = jsDocNodes[0].comment;
    if (typeof comment === 'string') {
      return comment.split('\n')[0].trim();
    }
  }
  return undefined;
}

function getSignature(node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction, sourceFile: ts.SourceFile): string {
  const params: string[] = [];
  for (const param of node.parameters) {
    const name = param.name.getText(sourceFile);
    const type = param.type ? param.type.getText(sourceFile) : 'any';
    const optional = param.questionToken ? '?' : '';
    params.push(`${name}${optional}: ${type}`);
  }
  const returnType = node.type ? node.type.getText(sourceFile) : 'void';
  return `(${params.join(', ')}) => ${returnType}`;
}

function isExported(node: ts.Node): boolean {
  if (ts.isExportAssignment(node)) return true;
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  if (modifiers) {
    return modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
  }
  return false;
}

function parseFile(filePath: string, projectRoot: string): { symbols: SymbolEntry[]; fileEntry: FileEntry } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const symbols: SymbolEntry[] = [];
  const exports: string[] = [];
  const imports: string[] = [];
  const relativePath = path.relative(projectRoot, filePath);

  function visit(node: ts.Node, parent?: string): void {
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      const exported = isExported(node);
      if (exported) exports.push(name);
      symbols.push({
        name, kind: 'function', file: relativePath, line, exported,
        signature: getSignature(node, sourceFile),
        jsdoc: getJSDoc(node, sourceFile), parent
      });
      return;
    }

    if (ts.isClassDeclaration(node) && node.name) {
      const className = node.name.text;
      const exported = isExported(node);
      if (exported) exports.push(className);
      symbols.push({
        name: className, kind: 'class', file: relativePath, line, exported,
        jsdoc: getJSDoc(node, sourceFile)
      });

      node.members.forEach(member => {
        if (ts.isMethodDeclaration(member) && member.name) {
          const methodName = member.name.getText(sourceFile);
          const methodLine = sourceFile.getLineAndCharacterOfPosition(member.getStart()).line + 1;
          symbols.push({
            name: methodName, kind: 'method', file: relativePath, line: methodLine, exported,
            signature: getSignature(member, sourceFile),
            jsdoc: getJSDoc(member, sourceFile), parent: className
          });
        }
      });
      return;
    }

    if (ts.isInterfaceDeclaration(node)) {
      const name = node.name.text;
      const exported = isExported(node);
      if (exported) exports.push(name);
      symbols.push({ name, kind: 'interface', file: relativePath, line, exported, jsdoc: getJSDoc(node, sourceFile) });
      return;
    }

    if (ts.isTypeAliasDeclaration(node)) {
      const name = node.name.text;
      const exported = isExported(node);
      if (exported) exports.push(name);
      symbols.push({ name, kind: 'type', file: relativePath, line, exported, jsdoc: getJSDoc(node, sourceFile) });
      return;
    }

    if (ts.isEnumDeclaration(node)) {
      const name = node.name.text;
      const exported = isExported(node);
      if (exported) exports.push(name);
      symbols.push({ name, kind: 'enum', file: relativePath, line, exported, jsdoc: getJSDoc(node, sourceFile) });
      return;
    }

    if (ts.isVariableStatement(node)) {
      const exported = isExported(node);
      node.declarationList.declarations.forEach(decl => {
        if (ts.isIdentifier(decl.name)) {
          const name = decl.name.text;
          if (exported) exports.push(name);
          let kind: SymbolEntry['kind'] = 'const';
          let signature: string | undefined;
          if (decl.initializer && ts.isArrowFunction(decl.initializer)) {
            kind = 'function';
            signature = getSignature(decl.initializer, sourceFile);
          }
          symbols.push({ name, kind, file: relativePath, line, exported, signature, jsdoc: getJSDoc(node, sourceFile) });
        }
      });
      return;
    }

    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        imports.push(moduleSpecifier.text);
      }
      return;
    }

    ts.forEachChild(node, child => visit(child, parent));
  }

  visit(sourceFile);
  return { symbols, fileEntry: { path: relativePath, exports, imports } };
}
