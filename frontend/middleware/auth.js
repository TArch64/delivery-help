function isBrowserCookieExists(cookieName) {
    // const expireTime = new Date();
    // expireTime.setTime(expireTime.getTime() + (1000));
    // const expires = 'expires=' + expireTime.toUTCString();
    //
    // document.cookie = cookieName + '=new_value;path=/;' + expires;
    // return document.cookie.indexOf(cookieName + '=') === -1;

    return true;
}

const AUTH_COOKIE = 'dh.auth';

export default function (context) {
    const isPublicRoute = context.route.meta.some(meta => meta.auth === 'public');
    if (isPublicRoute) return;

    const isAuthenticated = process.client ? isBrowserCookieExists(AUTH_COOKIE) : !!context.$cookies.get(AUTH_COOKIE);
    if (!isAuthenticated) context.redirect('/sign-in');
}
