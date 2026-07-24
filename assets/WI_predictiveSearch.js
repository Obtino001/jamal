class PredictiveSearch extends HTMLElement {
    constructor() {
      super();
  
      this.input = document.querySelector('#themeSearch');
      this.predictiveSearchResults = this.querySelector('#predictive-search');
  
      this.input.addEventListener('input', this.debounce((event) => {
        this.onChange(event);
      }, 300).bind(this));
      // this.reset();
    }
  
    onChange() {
      const searchTerm = this.input.value.trim();
  
      if (!searchTerm.length) {
        this.close();
        return;
      }
  
      this.getSearchResults(searchTerm);
    }
  
    getSearchResults(searchTerm) {
      fetch(`/search/suggest?q=${searchTerm}&section_id=predictive-search`)
        .then((response) => {
          if (!response.ok) {
            var error = new Error(response.status);
            this.close();
            throw error;
          }
  
          return response.text();
        })
        .then((text) => {
          const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-predictive-search').innerHTML;
          this.predictiveSearchResults.innerHTML = resultsMarkup;
          this.open();
          this.productWishPreload();
        })
        .catch((error) => {
          this.close();
          throw error;
        });
    }
  // reset() {
  //   this.querySelector('.saerchClear').addEventListener('click', ()=>{
  //     this.input.value = "";
  //     this.onChange();
  //   })
  // }
    open() {
      this.querySelector('.WI_searchUPsell').style.display = 'none';
      this.querySelector('.WI_searchResult').style.display = 'flex';
      // this.querySelector('.saerchClear').style.display = 'flex';
    }
  
    close() {
      this.querySelector('.WI_searchUPsell').style.display = 'flex';
      this.querySelector('.WI_searchResult').style.display = 'none';
      // this.querySelector('.saerchClear').style.display = 'none';
    }
  
    debounce(fn, wait) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    }
    // Preload all the product which is stored
    productWishPreload() {
          if (localStorage.getItem('productHandleArray') !== null) {
              var allwishlist = JSON.parse(localStorage.getItem('productHandleArray'));
              for (let i = 0; i < allwishlist.length; i++) {
                  var wish = "wish_" + allwishlist[i];
                  var wish_remove = "wish_remove_" + allwishlist[i];
                  var wishElement = document.getElementById(wish);
                  var wishRemoveElement = document.getElementById(wish_remove);
                  if (wishElement && wishRemoveElement) {
                      wishElement.style.display = "none";
                      wishRemoveElement.style.display = "flex";
                  } else {
                      
                  }
              }
          }
      };
  }
  
  customElements.define('predictive-search', PredictiveSearch);
  