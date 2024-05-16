
function generateReport() {
    const moduleNamesInput = document.getElementById('moduleNames');
    const moduleNames = moduleNamesInput.value.split(',').map(name => name.trim());

    fetch('/generate_report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moduleNames }),
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById('report').innerHTML = data;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
