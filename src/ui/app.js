document.addEventListener('DOMContentLoaded', () => {
    const endpointInput = document.getElementById('endpoint');
    const methodInput = document.getElementById('method');
    const payloadInput = document.getElementById('payload');
    const executeBtn = document.getElementById('execute-btn');
    const responseViewer = document.getElementById('response-viewer');
    const loader = document.getElementById('loader');
    const responseMeta = document.getElementById('response-meta');
    const statusCodeSpan = document.getElementById('status-code');
    const durationSpan = document.getElementById('duration');

    const presets = {
        add: {
            method: 'POST',
            endpoint: '/artemis/api/resource/v1/person/single/add',
            payload: {
                personId: "test001",
                personName: "Test User",
                gender: "1",
                orgIndexCode: "root000000"
            }
        },
        delete: {
            method: 'POST',
            endpoint: '/artemis/api/resource/v1/person/single/delete',
            payload: {
                personId: "test001"
            }
        },
        search: {
            method: 'POST',
            endpoint: '/artemis/api/resource/v1/person/advance/personList',
            payload: {
                pageNo: 1,
                pageSize: 10,
                personName: "Test User"
            }
        }
    };

    // Handle Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const key = e.target.dataset.preset;
            if (presets[key]) {
                endpointInput.value = presets[key].endpoint;
                methodInput.value = presets[key].method;
                payloadInput.value = JSON.stringify(presets[key].payload, null, 4);
            }
        });
    });

    // Handle Execute
    executeBtn.addEventListener('click', async () => {
        const endpoint = endpointInput.value.trim();
        const method = methodInput.value;
        const payloadStr = payloadInput.value.trim();
        let payload = {};

        if (!endpoint) {
            alert('Please enter an endpoint');
            return;
        }

        try {
            if (payloadStr) {
                payload = JSON.parse(payloadStr);
            }
        } catch (e) {
            alert('Invalid JSON in payload');
            return;
        }

        // UI State: Loading
        executeBtn.disabled = true;
        loader.classList.remove('hidden');
        responseViewer.classList.add('hidden');
        responseMeta.classList.add('hidden');
        responseViewer.textContent = '';
        responseViewer.classList.remove('error-text');

        try {
            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint,
                    method,
                    payload
                })
            });

            const data = await res.json();

            // Render Response
            responseViewer.textContent = JSON.stringify(data, null, 2);
            responseViewer.classList.remove('hidden');
            
            // Meta info
            statusCodeSpan.textContent = `Status: ${data.hikStatus || res.status}`;
            if (data.duration) {
                durationSpan.textContent = `Time: ${data.duration}ms`;
            }
            responseMeta.classList.remove('hidden');

            if (!res.ok || (data.hikStatus && data.hikStatus >= 400)) {
                responseViewer.classList.add('error-text');
            }

        } catch (err) {
            responseViewer.textContent = `Network Error: ${err.message}`;
            responseViewer.classList.remove('hidden');
            responseViewer.classList.add('error-text');
        } finally {
            executeBtn.disabled = false;
            loader.classList.add('hidden');
        }
    });
});
