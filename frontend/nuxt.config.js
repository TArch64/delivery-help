import colors from 'vuetify/lib/util/colors';

const { FRONTEND_API_SERVER_URL, FRONTEND_API_BROWSER_URL, FRONTEND_API_SOCKET_URL } = process.env;

export default {
    head: {
        title: 'DeliveryHelp',

        htmlAttrs: {
            lang: 'ua'
        },

        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { hid: 'description', name: 'description', content: '' },
            { name: 'format-detection', content: 'telephone=no' }
        ],

        link: [
            { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
        ]
    },

    build: {
        extractCSS: true
    },

    buildModules: [
        '@nuxtjs/vuetify',
        '@nuxtjs/device'
    ],

    modules: [
        '@nuxtjs/axios',
        'nuxt-socket-io',
        ['@nuxtjs/toast', { duration: 5000 }],
        'cookie-universal-nuxt'
    ],

    plugins: [
        '~/plugins/axios',
        '~/plugins/api-socket'
    ],

    server: {
        port: 8080,
        host: '0.0.0.0'
    },

    router: {
        middleware: 'auth'
    },

    css: [
        '~/styles/global.css'
    ],

    vuetify: {
        theme: {
            dark: false,
            themes: {
                light: {
                    primary: colors.indigo.base
                }
            }
        },
        icons: {
            iconfont: 'mdiSvg',
        },
        defaultAssets: {
            icons: false
        }
    },

    device: {
        refreshOnResize: true
    },

    axios: {
        baseUrl: FRONTEND_API_SERVER_URL + '/v1',
        browserBaseUrl: FRONTEND_API_BROWSER_URL + '/v1',
        credentials: true
    },

    io: {
        sockets: [
            {
                default: true,
                name: 'api',
                url: FRONTEND_API_SOCKET_URL
            }
        ]
    }
};
