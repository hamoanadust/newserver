'use strict';

(function() {
    var amount = document.querySelector('#amount');
    var amountLabel = document.querySelector('label[for="amount"]');
    var form = document.querySelector('#payment-form');
    var clientToken = document.getElementById('client-token').innerText;
    let title = document.getElementById('title');
    let hint = document.getElementById('hint');
    let success_result = document.getElementById('success-result');
    console.log('loaded...');
    console.log(amount);
  
    amount.addEventListener(
        'focus',
        function() {
            amountLabel.className = 'has-focus';
        },
        false
    );
    amount.addEventListener(
        'blur',
        function() {
            amountLabel.className = '';
        },
        false
    );

    window.braintree.dropin.create(
        {
            authorization: clientToken,
            container: '#bt-dropin'
        },
        (createErr, instance) => {
            form.addEventListener('submit', event => {
                event.preventDefault();
                instance.requestPaymentMethod((err, payload) => {
                    if (err) {
                        console.log('Error', err);
                        return;
                    }
                    const xhr = new XMLHttpRequest();
                    xhr.open("POST", "http://biddit.sg:4000/bt/checkout_invoice");
                    xhr.setRequestHeader('Content-type', 'application/json');
                    xhr.onreadystatechange = () => {
                        if (xhr.readyState == 4 && xhr.status == 200) {
                            console.log(xhr.responseText);
                            success_result.hidden = false;
                            title.hidden = true;
                            hint.hidden = true;
                            // form.hidden = true;
                        }
                    }
                    console.log({ data: { paymentMethodNonce: payload.nonce, invoice_id: Array.from(amount.value) } })
                    xhr.send(JSON.stringify({ data: { paymentMethodNonce: payload.nonce, invoice_id: Array.from(amount.value) } }));
                });
            });
        }
    );
})();
