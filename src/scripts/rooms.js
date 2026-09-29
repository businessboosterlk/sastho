// THE ROOMS BEHIND BUILD MY SPACE. A need is matched against the product's own name as the store wrote it,
// inside the shelves that belong to the room. Nothing here ranks by sales or by stars, because the store
// holds neither.
export const ROOMS = [
  { key: 'kitchen', name: 'Kitchen', img: 'room-kitchen.jpg', shelves: ['cookware', 'tools', 'storage', 'cleaning'], needs: [
    { name: 'Pots and pans', re: /\b(pan|pans|pot|wok|casserole|cooker|steamer)\b/i },
    { name: 'Knives and tools', re: /\b(knife|knives|peeler|grater|slicer|chopper|spatula|ladle|tong|whisk|strainer|skimmer|opener|masher)\w*/i },
    { name: 'Storage jars', re: /\b(jar|jars|canister|container|airtight|spice)\w*/i },
    { name: 'Baking', re: /\b(bak\w*|cake|mould|mold|icing|piping|muffin|rolling pin)\b/i },
    { name: 'Racks and organisers', re: /\b(rack|organi[sz]er|holder|basket|stand|shelf)\w*/i },
  ] },
  { key: 'dining', name: 'Dining room', img: 'room-dining.jpg', shelves: ['tableware', 'drinkware', 'tools'], needs: [
    { name: 'Plates and bowls', re: /\b(plate|bowl|platter|dish)\w*/i },
    { name: 'Glasses', re: /\b(glass|glasses|tumbler|goblet|stemware)\w*/i },
    { name: 'Mugs and cups', re: /\b(mug|cup|cups|saucer)\w*/i },
    { name: 'Cutlery', re: /\b(spoon|fork|knife|knives|cutlery|chopstick)\w*/i },
    { name: 'Serving and table', re: /\b(serving|tray|placemat|coaster|napkin|jug|pitcher)\w*/i },
  ] },
  { key: 'living', name: 'Living room', img: 'room-living.jpg', shelves: ['decor', 'lighting', 'storage'], needs: [
    { name: 'Lamps', re: /\b(lamp|lantern|light)\w*/i },
    { name: 'Clocks', re: /\bclock\w*/i },
    { name: 'Vases', re: /\bvase\w*/i },
    { name: 'Rugs and carpets', re: /\b(rug|carpet)\w*/i },
    { name: 'Wall art and ornaments', re: /\b(wall art|ornament|frame|candle)\w*/i },
  ] },
  { key: 'bedroom', name: 'Bedroom', img: 'room-bedroom.jpg', shelves: ['lighting', 'decor', 'storage', 'cleaning'], needs: [
    { name: 'Bedside lamps', re: /\b(lamp|lantern|night light)\w*/i },
    { name: 'Clocks', re: /\bclock\w*/i },
    { name: 'Baskets and storage', re: /\b(basket|storage|box|organi[sz]er)\w*/i },
    { name: 'Rugs and carpets', re: /\b(rug|carpet)\w*/i },
  ] },
  { key: 'bathroom', name: 'Bathroom', img: 'room-bathroom.jpg', shelves: ['cleaning', 'storage', 'decor'], needs: [
    { name: 'Soap and dispensers', re: /\b(soap|dispenser)\w*/i },
    { name: 'Bath mats', re: /\b(bath mat|bath|mat)\b/i },
    { name: 'Bins and baskets', re: /\b(dustbin|bin|trash|basket)\w*/i },
    { name: 'Holders and racks', re: /\b(holder|rack|hook|tissue)\w*/i },
  ] },
  { key: 'office', name: 'Home office', img: 'room-office.jpg', shelves: ['lighting', 'storage', 'drinkware', 'decor'], needs: [
    { name: 'Desk lamps', re: /\b(lamp|light)\w*/i },
    { name: 'Clocks', re: /\bclock\w*/i },
    { name: 'Organisers', re: /\b(organi[sz]er|holder|box|rack|stand)\w*/i },
    { name: 'Mugs and bottles', re: /\b(mug|cup|bottle|tumbler|flask)\w*/i },
  ] },
];
export const LOOKS = [
  { key: 'minimal', name: 'Clean and minimal', re: /\b(white|minimal\w*|matte|plain|simple|modern|clear|transparent)\b/i },
  { key: 'warm', name: 'Warm and natural', re: /\b(wood\w*|bamboo|rattan|woven|cream|beige|rustic|natural|brown|ivory)\b/i },
  { key: 'bold', name: 'Bold and dark', re: /\b(black|gold|gunmetal|marble|steel|stainless|smoke|grey|gray)\b/i },
  { key: 'classic', name: 'Classic', re: /\b(classic|elegant|ribbed|scalloped|floral|vintage|embossed|crystal|royal)\b/i },
];
export const BUDGETS = [
  { name: 'Up to Rs 2,000', max: 2000 },
  { name: 'Up to Rs 5,000', max: 5000 },
  { name: 'Up to Rs 10,000', max: 10000 },
  { name: 'Up to Rs 20,000', max: 20000 },
];
