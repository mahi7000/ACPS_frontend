const fs = require('fs');

const enPath = 'src/locales/en/translation.json';
const amPath = 'src/locales/am/translation.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const am = JSON.parse(fs.readFileSync(amPath, 'utf8'));

en.new_app = {
  "title": "New Application",
  "save_draft": "Save Draft",
  "step1": "Building Details",
  "step2": "Documents",
  "step3": "Neighbor Consent",
  "step4": "Review & Submit",
  "intended_use": "Intended Use",
  "project_value": "Project Value (ETB)",
  "height": "Height (m)",
  "floor_area": "Floor Area (sqm)",
  "floors_above": "Floors Above",
  "floors_below": "Floors Below",
  "location": "Location",
  "plot_address": "Plot Address",
  "subcity": "Subcity",
  "woreda": "Woreda",
  "gps_lat": "GPS Latitude",
  "gps_lng": "GPS Longitude",
  "professionals": "Professionals",
  "architect_name": "Architect Name",
  "architect_license": "Architect License",
  "next_step": "Next Step",
  "prev_step": "Previous",
  "required_docs": "Required Documents",
  "uploaded": "Uploaded",
  "required": "Required",
  "neighbor_consents": "Neighbor Consents",
  "neighbor_name": "Neighbor Name",
  "phone": "Phone Number",
  "consent_doc": "Consent Form Document",
  "add_neighbor": "Add Another Neighbor",
  "save_continue": "Save & Continue",
  "ready_submit": "Ready to Submit",
  "submit_app": "Submit Application",
  "submitting": "Submitting..."
};

am.new_app = {
  "title": "አዲስ ማመልከቻ",
  "save_draft": "ረቂቅ አስቀምጥ",
  "step1": "የህንፃ ዝርዝሮች",
  "step2": "ሰነዶች",
  "step3": "የጎረቤት ስምምነት",
  "step4": "ገምግም እና አስገባ",
  "intended_use": "የታሰበበት ጥቅም",
  "project_value": "የፕሮጀክት ዋጋ (በብር)",
  "height": "ከፍታ (ሜ)",
  "floor_area": "የወለል ስፋት (ካሬ ሜትር)",
  "floors_above": "ከመሬት በላይ ወለሎች",
  "floors_below": "ከመሬት በታች ወለሎች",
  "location": "አካባቢ",
  "plot_address": "የቦታ አድራሻ",
  "subcity": "ክፍለ ከተማ",
  "woreda": "ወረዳ",
  "gps_lat": "ላቲትዩድ",
  "gps_lng": "ሎንግቲዩድ",
  "professionals": "ባለሙያዎች",
  "architect_name": "የአርክቴክት ስም",
  "architect_license": "የአርክቴክት ፈቃድ",
  "next_step": "ቀጣይ እርምጃ",
  "prev_step": "ቀዳሚ",
  "required_docs": "አስፈላጊ ሰነዶች",
  "uploaded": "ተጭኗል",
  "required": "ያስፈልጋል",
  "neighbor_consents": "የጎረቤት ስምምነት",
  "neighbor_name": "የጎረቤት ስም",
  "phone": "ስልክ ቁጥር",
  "consent_doc": "የስምምነት ቅጽ ሰነድ",
  "add_neighbor": "ሌላ ጎረቤት ያክሉ",
  "save_continue": "አስቀምጥ እና ቀጥል",
  "ready_submit": "ለማስገባት ዝግጁ",
  "submit_app": "ማመልከቻ ያስገቡ",
  "submitting": "በማስገባት ላይ..."
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(amPath, JSON.stringify(am, null, 2));
console.log('Translations updated.');
