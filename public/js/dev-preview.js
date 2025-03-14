if (process.env.NODE_ENV === 'development') {
    // Live reload functionality
    const socket = new WebSocket('ws://localhost:3000/dev');
    socket.onmessage = () => window.location.reload();
    
    // Preview toolbar
    const toolbar = document.createElement('div');
    toolbar.innerHTML = `
        <div id="dev-toolbar" style="
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1a1a1a;
            color: #fff;
            padding: 8px;
            font-family: monospace;
            display: flex;
            justify-content: space-between;
            z-index: 9999;
        ">
            <div>
                Preview Mode | ${window.location.pathname}
            </div>
            <div>
                <select id="viewport-size">
                    <option value="desktop">Desktop</option>
                    <option value="tablet">Tablet</option>
                    <option value="mobile">Mobile</option>
                </select>
                <button onclick="toggleGrid()">Toggle Grid</button>
                <button onclick="toggleDarkMode()">Toggle Dark Mode</button>
            </div>
        </div>
    `;
    document.body.appendChild(toolbar);

    // Viewport switching
    document.getElementById('viewport-size').addEventListener('change', (e) => {
        const sizes = {
            desktop: '100%',
            tablet: '768px',
            mobile: '375px'
        };
        document.body.style.width = sizes[e.target.value];
        document.body.style.margin = '0 auto';
    });
}