/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'sockjs-client' {
    import SockJS from 'sockjs-client';
    export default SockJS;
}

declare module 'stompjs' {
    const Stomp: any;
    export default Stomp;
}
