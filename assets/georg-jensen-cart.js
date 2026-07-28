document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.georg-cart-section');
  if (!container) return;

  // Quantity Selectors
  const qtyWrappers = document.querySelectorAll('.js-input-number');
  qtyWrappers.forEach(wrapper => {
    const btnMinus = wrapper.querySelector('.js-input-number-minus');
    const btnPlus = wrapper.querySelector('.js-input-number-plus');
    const input = wrapper.querySelector('input[type="number"]');

    if (!btnMinus || !btnPlus || !input) return;

    btnMinus.addEventListener('click', function() {
      let val = parseInt(input.value, 10);
      if (val > 1) {
        input.value = val - 1;
        updateCart(input.dataset.key || input.id, input.value);
      }
    });

    btnPlus.addEventListener('click', function() {
      let val = parseInt(input.value, 10);
      input.value = val + 1;
      updateCart(input.dataset.key || input.id, input.value);
    });
    
    input.addEventListener('change', function() {
      updateCart(input.dataset.key || input.id, input.value);
    });
  });

  // Remove buttons
  const removeButtons = document.querySelectorAll('.button-remove');
  removeButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const key = btn.dataset.key;
      if (key) {
        updateCart(key, 0);
      }
    });
  });

  function updateCart(key, quantity) {
    if (!key) return;
    
    // Disable inputs while updating
    document.querySelectorAll('.georg-cart-section input, .georg-cart-section button').forEach(el => {
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.5';
    });

    fetch(window.Shopify.routes.root + 'cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: key,
        quantity: parseInt(quantity, 10)
      })
    })
    .then(response => response.json())
    .then(cart => {
      // Refresh the page to render the new totals correctly
      window.location.reload();
    })
    .catch(error => {
      console.error('Error updating cart:', error);
      window.location.reload();
    });
  }
});
