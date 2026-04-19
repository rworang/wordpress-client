<?php
/**
 * Plugin Name: Worang Client Companion
 * Plugin URI: https://github.com/rworang/wordpress-client
 * Description: Exposes the /worang-client/v1/* endpoints consumed by @worang/wordpress-client.
 * Version: 1.0.0
 * Author: Worang
 * License: MIT
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if (! defined('ABSPATH')) {
    exit;
}

const WORANG_CLIENT_COMPANION_VERSION = '1.0.0';
const WORANG_CLIENT_CACHE_OPTION = 'worang_client_cache_version';

function worang_client_companion_bump_cache_version(): void
{
    $token = sprintf('%.6f', microtime(true));
    update_option(WORANG_CLIENT_CACHE_OPTION, $token, false);
}

function worang_client_companion_activate(): void
{
    if (false === get_option(WORANG_CLIENT_CACHE_OPTION, false)) {
        worang_client_companion_bump_cache_version();
    }

    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'worang_client_companion_activate');

function worang_client_companion_deactivate(): void
{
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'worang_client_companion_deactivate');

add_action('rest_api_init', static function (): void {
    register_rest_route('worang-client/v1', '/version', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => static function () {
            return [
                'version' => WORANG_CLIENT_COMPANION_VERSION,
                'features' => ['cache-version'],
            ];
        },
    ]);

    register_rest_route('worang-client/v1', '/cache-version', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => static function () {
            $token = get_option(WORANG_CLIENT_CACHE_OPTION, '0');

            return [
                'version' => (string) $token,
            ];
        },
    ]);
});

add_action('save_post', 'worang_client_companion_bump_cache_version');
add_action('deleted_post', 'worang_client_companion_bump_cache_version');
add_action('edited_terms', 'worang_client_companion_bump_cache_version');
add_action('delete_term', 'worang_client_companion_bump_cache_version');
