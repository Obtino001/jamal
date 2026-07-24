const fs = require('fs');

let fileContent = fs.readFileSync('templates/product.json', 'utf-8');
// Strip out comments like /* ... */ at the beginning
fileContent = fileContent.replace(/\/\*[\s\S]*?\*\//, '').trim();
const data = JSON.parse(fileContent);

if (data.sections && data.sections.main) {
  const settings = data.sections.main.settings || {};
  
  const blocks = {
    "breadcrumbs_1": {
      "type": "breadcrumbs",
      "settings": {
        "breadcrumb_home": settings.breadcrumb_home || "Home",
        "breadcrumb_parent_label": settings.breadcrumb_parent_label || "Jewellery",
        "breadcrumb_parent_link": settings.breadcrumb_parent_link || ""
      }
    },
    "collection_link_1": {
      "type": "collection_link",
      "settings": {
        "collection_label": settings.collection_label || "",
        "collection_link": settings.collection_link || "",
        "collection_suffix": settings.collection_suffix || "Collection"
      }
    },
    "title_1": {
      "type": "title",
      "settings": {}
    },
    "material_1": {
      "type": "material",
      "settings": {
        "material_fallback": settings.material_fallback || "Sterling Silver"
      }
    },
    "usps_1": {
      "type": "usps",
      "settings": {
        "show_usps": settings.show_usps !== false,
        "usp_1": settings.usp_1 || "Handmade in Australia",
        "usp_2": settings.usp_2 || "Take two and the third is on me",
        "usp_3": settings.usp_3 || "Free shipping today"
      }
    },
    "variant_picker_1": {
      "type": "variant_picker",
      "settings": {
        "choose_option_label": settings.choose_option_label || "Choose size",
        "size_required_error": settings.size_required_error || "Please choose a size",
        "show_delivery_note": settings.show_delivery_note !== false,
        "delivery_note_text": settings.delivery_note_text || "The product has extended delivery time of 2-4 weeks."
      }
    },
    "price_1": {
      "type": "price",
      "settings": {}
    },
    "buy_buttons_1": {
      "type": "buy_buttons",
      "settings": {
        "add_to_cart_label": settings.add_to_cart_label || "Add to basket",
        "sold_out_label": settings.sold_out_label || "Sold out",
        "unavailable_label": settings.unavailable_label || "Unavailable",
        "show_wishlist": settings.show_wishlist !== false,
        "wishlist_label": settings.wishlist_label || "Add to Wishlist",
        "wishlist_remove_label": settings.wishlist_remove_label || "Remove from Wishlist"
      }
    },
    "gift_wrapping_1": {
      "type": "gift_wrapping",
      "settings": {
        "show_gift_wrapping": settings.show_gift_wrapping !== false,
        "gift_wrapping_text": settings.gift_wrapping_text || "Complimentary gift wrapping",
        "gift_wrapping_image": settings.gift_wrapping_image || ""
      }
    },
    "description_1": {
      "type": "description",
      "settings": {
        "read_more_label": settings.read_more_label || "Read more",
        "read_less_label": settings.read_less_label || "Read less"
      }
    },
    "product_details_1": {
      "type": "product_details",
      "settings": {
        "details_heading": settings.details_heading || "Product details",
        "item_number_label": settings.item_number_label || "Item number:",
        "materials_label": settings.materials_label || "Materials:",
        "measurements_label": settings.measurements_label || "Measurements:",
        "measurements_fallback": settings.measurements_fallback || "W: 8 mm. L: 42 mm.",
        "design_year_label": settings.design_year_label || "Design year:",
        "design_year_fallback": settings.design_year_fallback || "2026",
        "collection_meta_label": settings.collection_meta_label || "Collection:",
        "explore_label": settings.explore_label || "Explore:",
        "explore_text": settings.explore_text || "Earrings",
        "explore_link": settings.explore_link || ""
      }
    },
    "shipping_1": {
      "type": "shipping",
      "settings": {
        "shipping_heading": settings.shipping_heading || "Shipping and returns",
        "shipping_content": settings.shipping_content || "<ul><li>Free gift wrapping on full priced items</li><li>Shipping by UPS</li><li>Easy exchanges and returns</li></ul>"
      }
    },
    "phone_1": {
      "type": "phone",
      "settings": {
        "phone_label": settings.phone_label || "Call",
        "phone_number": settings.phone_number || "+45 38 14 90 44"
      }
    },
    "gallery_extension_1": {
      "type": "gallery_extension",
      "settings": {
        "gallery_extension_text": settings.gallery_extension_text || "Weft draws on the structures of weaving, translating them into sterling silver jewellery defined by a sense of movement.",
        "gallery_extension_image": settings.gallery_extension_image || ""
      }
    }
  };

  const existingBlocks = data.sections.main.blocks || {};
  Object.assign(blocks, existingBlocks);

  data.sections.main.blocks = blocks;
  
  const newOrder = [
    "breadcrumbs_1",
    "collection_link_1",
    "title_1",
    "material_1",
    "usps_1",
    "variant_picker_1",
    "price_1",
    "ring_size_cXhVCf",
    "buy_buttons_1",
    "gift_wrapping_1",
    "description_1",
    "product_details_1",
    "shipping_1",
    "phone_1",
    "gallery_extension_1"
  ];
  
  for (const blockId of Object.keys(existingBlocks)) {
    if (!newOrder.includes(blockId)) {
      newOrder.push(blockId);
    }
  }

  data.sections.main.block_order = newOrder;

  const settingsToRemove = [
    "breadcrumb_home", "breadcrumb_parent_label", "breadcrumb_parent_link", "collection_label", "collection_link", "collection_suffix",
    "material_fallback", "choose_option_label", "show_usps", "usp_1", "usp_2", "usp_3", "size_required_error", "show_delivery_note", "delivery_note_text",
    "add_to_cart_label", "sold_out_label", "unavailable_label", "show_wishlist", "wishlist_label", "wishlist_remove_label",
    "read_more_label", "read_less_label", "show_gift_wrapping", "gift_wrapping_text", "gift_wrapping_image", "gallery_extension_text", "gallery_extension_image",
    "details_heading", "item_number_label", "materials_label", "measurements_label", "measurements_fallback", "design_year_label", "design_year_fallback",
    "collection_meta_label", "explore_label", "explore_text", "explore_link", "show_shipping_accordion", "shipping_heading", "shipping_content",
    "show_phone", "phone_label", "phone_number"
  ];
  settingsToRemove.forEach(s => delete data.sections.main.settings[s]);

  const finalOutput = `/*
 * ------------------------------------------------------------
 * IMPORTANT: The contents of this file are auto-generated.
 *
 * This file may be updated by the Shopify admin theme editor
 * or related systems. Please exercise caution as any changes
 * made to this file may be overwritten.
 * ------------------------------------------------------------
 */
${JSON.stringify(data, null, 2)}`;

  fs.writeFileSync('templates/product.json', finalOutput);
  console.log('product.json updated.');
} else {
  console.log('main section not found in product.json');
}
