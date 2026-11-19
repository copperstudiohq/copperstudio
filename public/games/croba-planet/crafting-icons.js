const paths={
 debris:'<path d="m6 14 18-7 12 9-5 17-20-4z" fill="#829296" stroke="#d2b58a"/><path d="m9 19 18-6-2 13-12-1m17-12 2 15" fill="none" stroke="#3c555b" stroke-width="3"/>',
 'broken-hammer':'<path d="m18 18 7 2-7 19-5-2z" fill="#866b4b"/><path d="m7 6 25 5-2 11-14-2-2-6-9-1z" fill="#8d999a" stroke="#d0c9b4"/><path d="m17 24 6 2m-8 2 6 2m-8 2 6 2" stroke="#b9d9ce" stroke-width="3"/>',
 workbench:'<path d="M5 13h32v7H5z" fill="#b08b58" stroke="#eed0a1"/><path d="m10 20-2 17m24-17 2 17M10 32h23M17 13V7h9v6" fill="none" stroke="#89a5a7" stroke-width="4"/>',
 'rusty-copper-knife':'<path d="M8 34 27 9l8-4-4 13-16 20z" fill="#c58852" stroke="#f1c28b"/><path d="m8 34 8-10 6 5-8 10z" fill="#435e65"/><path d="m18 24 7-10" stroke="#845342" stroke-width="2"/>',
 'rock-chipper':'<path d="m16 14 7 2-3 23-6-1z" fill="#667b7e"/><path d="m5 13 9-8 15 3 9 10-11-5-13 2-8 9z" fill="#9da8a3" stroke="#dccba6"/>',
 identifier:'<path d="m9 8 23 2 3 23-10 6-15-5z" fill="#617d80" stroke="#b5ccc2"/><path d="m14 14 13 1 1 10-13-1z" fill="#c8dbae"/><circle cx="22" cy="20" r="4" fill="none" stroke="#477b79"/><path d="m15 30 9 1" stroke="#d5a469" stroke-width="3"/>',
 'builder-tool':'<path d="m5 13 24-6 9 8-5 12-11 1-3 11-8-2 1-13-7-1z" fill="#c08d58" stroke="#ead7a7"/><path d="m29 9 7 6-4 9-8-1z" fill="#719eac"/><path d="m9 17 12-3m-8 16 7 1" stroke="#314a54" stroke-width="4"/>',
 'universal-base':'<path d="m4 16 17-10 17 10v20H4z" fill="#819397" stroke="#d3dfd4"/><path d="M6 17h30M10 20h8v8h-8zm15 0h8v8h-8zM19 36V23h5v13" fill="#b9dce0" stroke="#354f58"/>',
};
export function craftingIcon(id){
 if(!Object.hasOwn(paths,id))throw new TypeError(`Unknown crafting illustration: ${id}.`);
 return `<svg viewBox="0 0 42 42" aria-hidden="true" focusable="false">${paths[id]}</svg>`;
}
