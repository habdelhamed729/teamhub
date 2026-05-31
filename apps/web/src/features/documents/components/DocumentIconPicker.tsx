import { useState, useRef } from "react";
import { Button } from "@/shared/components/Button";
import { useClickOutside } from "@/shared/hooks/useClickOutside";

export const EMOJI_CATEGORIES = [
  {
    name: "Faces",
    icon: "😀",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳"],
  },
  {
    name: "Work",
    icon: "💼",
    emojis: ["📝", "📁", "🚀", "💡", "🎯", "🎨", "🛠️", "📊", "💻", "🔒", "⚡", "🔔", "✉️", "🔥", "🏆", "🌟", "📚", "🖊️", "🔍", "📎", "💼", "📈", "📢", "💬", "📅", "📆", "🗂️", "🔐", "🔑", "🧠", "⚙️"],
  },
  {
    name: "Objects",
    icon: "🔋",
    emojis: ["🔋", "🔌", "📸", "🎧", "🎤", "🧩", "📦", "🎁", "🎈", "🔮", "🧹", "🧺", "💈", "🩺", "🧪", "🧫", "🧬", "🔭", "🔬", "🧯", "🛒", "🛏️", "🛋️", "🚽", "🚿", "🛁", "🔑", "🗝️", "🔨", "🔧", "🪛", "🪚"],
  },
  {
    name: "Nature",
    icon: "🌿",
    emojis: ["🌿", "🌸", "🍀", "🍁", "🍂", "🐾", "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🦋", "🐌", "🐞"],
  },
  {
    name: "Food",
    icon: "🍕",
    emojis: ["🍎", "🍕", "🍔", "🍟", "🌭", "🍿", "🍩", "🍪", "🎂", "🍰", "🍫", "🍬", "🍦", "🍇", "🍓", "🍉", "🍋", "🍌", "🍍", "🥭", "🍒", "🍑", "🍐", "🥦", "🥑", "🍆", "🥔", "🥕", "🌽", "🌶️", "🍄", "🧀"],
  },
  {
    name: "Travel",
    icon: "✈️",
    emojis: ["✈️", "🚀", "🏡", "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚜", "🚲", "🛵", "🏍️", "🛺", "🚂", "🚈", "🚄", "🚝", "⛴️", "🚢", "🛫", "🛬", "🛰️", "🚠", "🗺️", "🌐"],
  },
  {
    name: "Symbols",
    icon: "❓",
    emojis: ["❓", "❗", "❌", "✅", "⚠️", "🌀", "💤", "🌐", "💠", "🔅", "🔆", "🔴", "🔵", "⚫", "⚪", "🟩", "🟨", "🟧", "🟥", "🟦", "🟪", "🟫", "💘", "💖", "💗", "💓", "💞", "💕", "💔", "❤️", "🧡", "💛"],
  },
  {
    name: "Flags",
    icon: "🚩",
    emojis: ["🚩", "🏳️", "🏴", "🏴‍☠️", "🏁", "🎌", "🇺🇸", "🇬🇧", "🇩🇪", "🇫🇷", "🇯🇵", "🇨🇳", "🇰🇷", "🇮🇹", "🇪🇸", "🇨🇦", "🇦🇺", "🇧🇷", "🇷🇺", "🇮🇳", "🇲🇽", "🇪🇺", "🇺🇳", "🇿🇦", "🇸🇪", "🇨🇭", "🇳🇱", "🇳🇴", "🇸🇬", "🇹🇷", "🇸🇦", "🇦🇪"],
  },
];

export const emojiNames: Record<string, string> = {
  "📝": "document write edit note letter pen",
  "📁": "folder directory archive file",
  "🚀": "rocket launch ship space fly fast",
  "💡": "idea bulb light intelligence thinking",
  "📅": "calendar date schedule event month",
  "🎯": "target focus goal hit bullseye",
  "🎨": "art paint brush palette design creative",
  "🛠️": "tools hammer wrench repair debug build",
  "📊": "chart bar graph analytics stats report",
  "💻": "computer laptop code tech screen hardware",
  "🔒": "lock secure private key padlock close",
  "⚡": "thunder lightning electric speed fast power",
  "🔔": "bell notification alert ring sound",
  "✉️": "mail email envelope letter post inbox",
  "🔥": "fire hot flame popular trending energy",
  "🏆": "trophy winner cup gold champion reward",
  "🌟": "star shine glitter rating gold premium",
  "🌈": "rainbow color spectrum sky nature",
  "🍎": "apple fruit food red healthy",
  "🍕": "pizza food cheese slice italian",
  "✈️": "plane airplane travel fly airport",
  "🏡": "home house building family domestic",
  "🐾": "paw print animal pet dog cat track",
  "😀": "smile face happy grin laugh joy",
  "😃": "smile face happy grin laugh open mouth",
  "😄": "smile face happy grin laugh squint",
  "😁": "smile face happy grin teeth beam",
  "😆": "smile face happy grin squint laugh",
  "😅": "smile face happy sweat cold sweat relief",
  "😂": "smile face happy tears joy laugh cry",
  "🤣": "smile face happy rofl rolling laugh",
  "😊": "smile face happy blush warm",
  "😇": "smile face happy halo angel holy",
  "🙂": "smile face happy slight tilt",
  "🙃": "smile face happy upside down silly",
  "😉": "smile face happy wink eye blink",
  "😌": "smile face happy relieved calm peace",
  "😍": "heart eyes love smile romance beauty",
  "🥰": "hearts face love warm blush affection",
  "😘": "kiss blow heart love face romantic",
  "😗": "kiss face duck lips romantic",
  "😙": "kiss face squint eyes romantic",
  "😚": "kiss face closed eyes romantic",
  "😋": "yum tongue food tasty delicious hungry",
  "😛": "tongue face silly playful stuck out",
  "😝": "tongue face squint silly playful stuck out",
  "😜": "tongue face wink silly playful stuck out",
  "🤪": "zany goofy crazy face silly eye wild",
  "🤨": "raised eyebrow face suspect doubt question",
  "🧐": "monocle face smart detective investigator",
  "🤓": "nerd face geek smart glasses intellectual",
  "😎": "cool sunglasses face chill confident",
  "🥸": "disguise mustache mask spy glasses",
  "🤩": "star struck wowed eyes stars excited",
  "🥳": "party party horn blower hat celebration event",
  "📚": "books library read study homework learn",
  "🖊️": "pen writing write signature sign",
  "🔍": "search magnifying glass find search zoom",
  "📎": "paperclip attach file bind document hold",
  "💼": "briefcase work job business portfolio office",
  "📈": "chart graph growth statistics trend up",
  "📢": "megaphone announce broadcast news speaker",
  "💬": "bubble chat comment talk speech text message",
  "📆": "calendar tear-off date schedule event",
  "🗂️": "folders card index dividers files archive",
  "🔐": "secure locked key keyhole closed private",
  "🔑": "key access open lock unlock password",
  "🧠": "brain smart mind intelligence psychology think",
  "⚙️": "gear cog settings wheel mechanics process",
  "🔋": "battery energy power charge level source",
  "🔌": "plug electric wire power connector connect",
  "📸": "camera photo snap shoot picture lens",
  "🎧": "headphones music audio sound listen song",
  "🎤": "microphone sing talk audio podcast voice",
  "🧩": "puzzle piece jigsaw solve game fit",
  "📦": "package box delivery parcel post ship",
  "🎁": "gift present box ribbon birthday surprise",
  "🎈": "balloon party celebration air float birthday",
  "🔮": "crystal ball magic future fortune teller",
  "🧹": "broom clean sweep dust magic witch",
  "🧺": "basket laundry picnic woven container",
  "💈": "barber pole hair cut salon shop",
  "🩺": "stethoscope doctor medical health clinical heart",
  "🧪": "test tube chemical lab science research",
  "🧫": "petri dish bacteria biology lab science culture",
  "🧬": "dna gene biology molecule helix science life",
  "🔭": "telescope star space astronomy galaxy view",
  "🔬": "microscope cells biology lab science research zoom",
  "🧯": "extinguisher fire safety emergency red",
  "🛒": "cart shopping grocery store buy market",
  "🛏️": "bed sleep hotel rest furniture bedroom",
  "🛋️": "sofa couch living room lounge furniture",
  "🚽": "toilet bathroom restroom water closet",
  "🚿": "shower water bathroom clean wash spray",
  "🛁": "bathtub bath bathroom bubble wash clean",
  "🗝️": "old key vintage secret unlock password",
  "🔨": "hammer tool build construct strike nail",
  "🔧": "wrench tool spanner fix tight adjust",
  "🪛": "screwdriver tool turn screw fix tight",
  "🪚": "saw tool cut wood hand carpentry build",
  "🐶": "dog puppy pet animal canine cute friend",
  "🐱": "cat kitten pet animal feline meow cute",
  "🐭": "mouse rat rodent animal whiskers",
  "🐹": "hamster rodent cute animal pet cheeks",
  "🐰": "rabbit bunny pet cute animal ears carrot",
  "🦊": "fox wild animal smart orange bushy tails",
  "🐻": "bear wild animal brown grizzly teddy",
  "🐼": "panda animal bear black white bamboo china",
  "🐨": "koala bear marsupial animal tree eucalyptus",
  "🐯": "tiger cat striped animal wild carnivore",
  "🦁": "lion cat wild animal king mane",
  "🐮": "cow milk animal farm cattle beef",
  "🐷": "pig pork animal farm pink snout",
  "🐸": "frog amphibian green toad animal hop",
  "🐵": "monkey animal ape banana climb forest",
  "🐔": "chicken bird poultry egg hen farm rooster",
  "🐧": "penguin bird ice snow antarctica tuxedo swim",
  "🐦": "bird wing fly tweet animal nature sky",
  "🐤": "chick baby chicken bird yellow egg cute",
  "🦆": "duck water bird quack lake pond feathers",
  "🦅": "eagle bird prey fly raptor wing national",
  "🦉": "owl bird night wise forest hoot eyes",
  "🦇": "bat night fly cave mammal halloween vampire",
  "🦋": "butterfly insect color wings fly cocoon cocoon",
  "🐌": "snail slow shell garden insect bug crawl",
  "🐞": "ladybug bug insect red spots garden lucky",
  "🍔": "burger food cheese hamburger meat beef fast",
  "🍟": "fries french potato chips salt fast",
  "🌭": "hotdog sausage bread mustard fast",
  "🍿": "popcorn movie theater snack corn butter",
  "🍩": "donut sweet glaze dessert sugar sprinkle",
  "🍪": "cookie sweet chocolate chip dessert biscuit",
  "🎂": "cake birthday candle dessert sweet celebrate",
  "🍰": "cake slice dessert sweet pastry bakery strawberry",
  "🍫": "chocolate bar sweet candy cocoa dessert",
  "🍬": "candy sweet wrapped sugar treat caramel",
  "🍦": "icecream soft serve cone vanilla sweet dessert",
  "🍇": "grapes fruit wine bunch purple healthy",
  "🍓": "strawberry fruit red sweet healthy berry",
  "🍉": "watermelon fruit summer green pink juicy seeds",
  "🍋": "lemon fruit yellow sour citrus acid juice",
  "🍌": "banana fruit yellow potassium peel tropical",
  "🍍": "pineapple fruit spiky tropical sweet juice yellow",
  "🥭": "mango fruit sweet orange tropical seed juice",
  "🍒": "cherries fruit red stone sweet healthy berries",
  "🍑": "peach fruit soft orange skin sweet stone juicy",
  "🍐": "pear fruit green sweet light snack healthy",
  "🥦": "broccoli vegetable green tree healthy diet",
  "🥑": "avocado fruit green fat pit seed toast guacamole",
  "🍆": "eggplant vegetable purple aubergine plant",
  "🥔": "potato root vegetable starch french fries baked",
  "🥕": "carrot vegetable orange root rabbit eye vision",
  "🌽": "corn cob yellow grain farm popcorn sweet",
  "🌶️": "pepper chili hot spicy red vegetable salsa",
  "🍄": "mushroom fungus forest plant toadstool cap",
  "🧀": "cheese dairy yellow slice holes swiss dairy",
  "🚗": "car automobile vehicle drive road traffic",
  "🚕": "taxi yellow cab passenger vehicle transit ride",
  "🚙": "suv car vehicle utility drive offroad auto",
  "🚌": "bus transit vehicle public drive passenger shuttle",
  "🚎": "trolleybus bus wire electric transit passenger vehicle",
  "🏎️": "racing car F1 formula track drive sports auto",
  "🚓": "police car siren vehicle officer emergency law",
  "🚑": "ambulance siren vehicle medic medical emergency hospital",
  "🚒": "fire truck engine siren emergency water fight red",
  "🚐": "minibus van transit vehicle transport shuttle drive",
  "🛻": "pickup truck bed utility vehicle drive carry cargo",
  "🚚": "truck delivery cargo transport shipment container logistics",
  "🚜": "tractor farm vehicle crop harvest agriculture engine",
  "🚲": "bicycle bike cycle pedal wheels transit sport ride",
  "🛵": "scooter moped transit bike drive wheels traffic",
  "🏍️": "motorcycle bike motor wheels speed ride sports",
  "🛺": "auto rickshaw tuktuk three-wheeler taxi transit passenger",
  "🚂": "locomotive train steam engine rail transport track",
  "🚈": "light rail train rail transit passenger transport track",
  "🚄": "bullet train shinkansen fast speed transport track rail",
  "🚝": "monorail train track overhead rail transit passenger",
  "⛴️": "ferry boat ship water transit transport passenger lake",
  "🚢": "ship cargo boat vessel water ocean cruise container",
  "🛫": "takeoff plane fly airport departure sky travel",
  "🛬": "landing plane fly airport arrival runway travel",
  "🛰️": "satellite orbit space communication tech broadcast",
  "🚠": "cable car mountain rope sky aerial transit gondola",
  "🗺️": "map directions route location world geography paper",
  "🌐": "globe world internet network online website communication",
  "❓": "question mark ask query help details info request",
  "❗": "exclamation mark alert warning attention note priority",
  "❌": "cross wrong false bad cancel close delete incorrect",
  "✅": "check correct true good ok pass right correct",
  "⚠️": "warning hazard danger caution alert triangle yellow",
  "🌀": "typhoon hurricane storm wind spiral weather",
  "💤": "sleep zzz snoring tired dream night nap rest",
  "💠": "diamond shape flower blue dot abstract symbol",
  "🔅": "dim brightness low screen display button",
  "🔆": "bright brightness high screen display light button",
  "🔴": "red circle dot symbol color round button",
  "🔵": "blue circle dot symbol color round button",
  "⚫": "black circle dot symbol color round button",
  "⚪": "white circle dot symbol color round button",
  "🟩": "green square color box shape symbol",
  "🟨": "yellow square color box shape symbol",
  "🟧": "orange square color box shape symbol",
  "🟥": "red square color box shape symbol",
  "🟦": "blue square color box shape symbol",
  "🟪": "purple square color box shape symbol",
  "🟫": "brown square color box shape symbol",
  "💘": "heart arrow cupid love romance valentines bow",
  "💖": "sparkle heart love shine glitter pink romance",
  "💗": "growing heart love expanding pink scale romance",
  "💓": "beating heart love pulse pink heartbeat rhythm",
  "💞": "revolving hearts love circle pink romance spin",
  "💕": "two hearts love pink couple romance friend",
  "💔": "broken heart sad break end love separation pain",
  "❤️": "red heart love romance passion favorite classic",
  "🧡": "orange heart love friendly support color",
  "💛": "yellow heart love friendship warm color",
  "🚩": "flag post marker goal pin point signal red",
  "🏳️": "white flag surrender peace truce signal",
  "🏴": "black flag dark signal symbol color",
  "🏴‍☠️": "flag skull crossbones jolly roger ship sea",
  "🏁": "chequered flag finish race winner start track end",
  "🎌": "crossed flags celebration festival japan holiday",
  "🇺🇸": "usa america flag country nation states",
  "🇬🇧": "uk britain flag country nation united kingdom",
  "🇩🇪": "germany flag country nation deutsche europe",
  "🇫🇷": "france flag country nation French europe",
  "🇯🇵": "japan flag country nation nippon asia",
  "🇨🇳": "china flag country nation chinese asia",
  "🇰🇷": "korea flag country nation south asia",
  "🇮🇹": "italy flag country nation italian europe",
  "🇪🇸": "spain flag country nation spanish europe",
  "🇨🇦": "canada flag country nation maple leaf north",
  "🇦🇺": "australia flag country nation down under oceania",
  "🇧🇷": "brazil flag country nation south american",
  "🇷🇺": "russia flag country nation russian europe",
  "🇮🇳": "india flag country nation indian asia",
  "🇲🇽": "mexico flag country nation spanish central",
  "🇪🇺": "europe flag union continent countries",
  "🇺🇳": "un united nations flag international global",
  "🇿🇦": "south africa flag country nation continent",
  "🇸🇪": "sweden flag country nation swedish scandinavia",
  "🇨🇭": "switzerland flag country nation swiss red cross",
  "🇳🇱": "netherlands flag country nation dutch holland",
  "🇳🇴": "norway flag country nation norwegian scandinavia",
  "🇸🇬": "singapore flag country nation asia lion city",
  "🇹🇷": "turkey flag country nation turkish europe asia",
  "🇸🇦": "saudi arabia flag country nation middle east",
  "🇦🇪": "uae emirates flag country nation middle east dubai",
};

interface DocumentIconPickerProps {
  icon: string | null;
  onUpdateIcon: (icon: string | null) => Promise<any> | void;
  coverUrl: string | null;
}

export const DocumentIconPicker = ({
  icon,
  onUpdateIcon,
  coverUrl,
}: DocumentIconPickerProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Faces");
  
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close the picker on outside click, ignoring clicks on the trigger button
  useClickOutside(emojiPickerRef, () => {
    setShowEmojiPicker(false);
    setEmojiSearch("");
  }, [triggerRef]);

  if (!icon) return null;

  const handleSelectEmoji = (emo: string) => {
    onUpdateIcon(emo);
    setShowEmojiPicker(false);
    setEmojiSearch("");
  };

  const handleRemoveIcon = () => {
    onUpdateIcon(null);
    setShowEmojiPicker(false);
    setEmojiSearch("");
  };

  return (
    <div className={`relative z-10 ${coverUrl ? "-mt-20 mb-4" : "mb-6"}`}>
      <button
        ref={triggerRef}
        id="emoji-trigger-btn"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className="text-5xl hover:scale-105 transition-transform p-2.5 bg-main-bg rounded-2xl border border-white/5 cursor-pointer shadow-xl inline-block"
      >
        {icon}
      </button>

      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="popover-panel absolute left-0 top-full mt-2 p-3.5 w-72 flex flex-col gap-3 animate-in fade-in duration-200"
        >
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search emojis..."
            value={emojiSearch}
            onChange={(e) => setEmojiSearch(e.target.value)}
            className="w-full bg-main-bg border border-white/5 focus:border-primary-accent/40 rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-accent/30 transition-all"
          />

          {/* Categories Tab Navigation */}
          {!emojiSearch && (
            <div className="flex justify-between border-b border-white/5 pb-2 overflow-x-auto scrollbar-none">
              {EMOJI_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`p-1 text-base rounded-md hover:bg-white/5 transition-colors cursor-pointer ${
                    activeCategory === cat.name ? "bg-white/10" : ""
                  }`}
                  title={cat.name}
                >
                  {cat.icon}
                </button>
              ))}
            </div>
          )}

          {/* Emojis Grid */}
          <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto pr-1">
            {(emojiSearch
              ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter(
                  (emo, index, self) =>
                    self.indexOf(emo) === index && // deduplicate
                    (emojiNames[emo]?.toLowerCase().includes(emojiSearch.toLowerCase()) ||
                      emo === emojiSearch)
                )
              : EMOJI_CATEGORIES.find((c) => c.name === activeCategory)?.emojis || []
            ).map((emo) => (
              <button
                key={emo}
                onClick={() => handleSelectEmoji(emo)}
                className="text-xl hover:bg-white/10 p-1 rounded-lg transition-colors cursor-pointer flex items-center justify-center h-8 w-8"
              >
                {emo}
              </button>
            ))}
            {emojiSearch &&
              EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter(
                (emo, index, self) =>
                  self.indexOf(emo) === index &&
                  (emojiNames[emo]?.toLowerCase().includes(emojiSearch.toLowerCase()) ||
                    emo === emojiSearch)
              ).length === 0 && (
                <div className="col-span-6 text-center text-xs text-text-muted py-4">
                  No matches found
                </div>
              )}
          </div>

          <div className="border-t border-white/5 pt-2">
            <Button
              variant="ghost"
              onClick={handleRemoveIcon}
              className="w-full text-xs text-danger hover:bg-danger/10 py-1.5 rounded-lg font-bold transition-all border-transparent"
            >
              Remove Icon
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
