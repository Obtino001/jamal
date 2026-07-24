const fs = require('fs');

const filesToUpdate = [
  'sections/georg-jensen-about.liquid',
  'sections/georg-jensen-contact.liquid',
  'sections/designer-spotlight.liquid',
  'sections/georg-jensen-hero.liquid',
  'sections/georg-jensen-split-banner.liquid'
];

for (const file of filesToUpdate) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Example matches:
  // class="georg-about-header" data-aos="fade-up"
  // class="georg-about-hero-media" data-aos="fade-up" data-aos-delay="100"
  
  // 1. First add the classes to the class attribute where data-aos exists
  content = content.replace(/class="([^"]+)"\s+data-aos="[^"]+"(?:\s+data-aos-delay="[^"]+")?/g, 'class="$1 scroll-trigger animate--slide-in"');
  
  // 2. Some elements might have had data-aos BEFORE class or without class? Unlikely in my previous edits, but just in case:
  content = content.replace(/data-aos="[^"]+"(?:\s+data-aos-delay="[^"]+")?\s+class="([^"]+)"/g, 'class="$1 scroll-trigger animate--slide-in"');

  // Let's just be sure: I will do a manual regex replacement that is robust.
  // The above replace should catch all the ones I added.
  
  // Also, let's catch cases where the delay has liquid tags like {{ forloop.index }}
  content = content.replace(/class="([^"]+)"\s+data-aos="[^"]+"(?:\s+data-aos-delay="[^"]+")?/g, 'class="$1 scroll-trigger animate--slide-in"');
  
  fs.writeFileSync(file, content, 'utf-8');
  console.log(`Updated ${file}`);
}
