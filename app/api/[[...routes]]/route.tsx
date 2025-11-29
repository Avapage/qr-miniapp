/** @jsxImportSource frog/jsx */
import { Frog, Button, TextInput } from "frog";
import { handle } from "frog/next";

// ----------------------
// NETWORK METADATA
// ----------------------
const networks = {
  eth: {
    name: "Ethereum",
    explorer: "https://etherscan.io/address/",
    color: "#627EEA",
  },
  base: {
    name: "Base",
    explorer: "https://basescan.org/address/",
    color: "#0052FF",
  },
  op: {
    name: "Optimism",
    explorer: "https://optimistic.etherscan.io/address/",
    color: "#FF0420",
  },
  arb: {
    name: "Arbitrum",
    explorer: "https://arbiscan.io/address/",
    color: "#28A0EF",
  },
  polygon: {
    name: "Polygon",
    explorer: "https://polygonscan.com/address/",
    color: "#8247E5",
  },
  bnb: {
    name: "BNB Chain",
    explorer: "https://bscscan.com/address/",
    color: "#F3BA2F",
  },
  avax: {
    name: "Avalanche",
    explorer: "https://snowtrace.io/address/",
    color: "#E84142",
  },
  fantom: {
    name: "Fantom",
    explorer: "https://ftmscan.com/address/",
    color: "#1969FF",
  },
  gnos: {
    name: "Gnosis Chain",
    explorer: "https://gnosisscan.io/address/",
    color: "#48A9A6",
  },
} as const;

type NetworkKey = keyof typeof networks;

// ----------------------
// ADDRESS VALIDATION
// ----------------------
function isValidAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// ----------------------
// ENS RESOLVER
// ----------------------
async function resolveENS(name: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.ensideas.com/ens/resolve/${name}`
    ).then((r) => r.json());
    return res?.address || null;
  } catch {
    return null;
  }
}

// ----------------------
// APP INIT
// ----------------------
const app = new Frog({
  basePath: "/api",
  title: "QR Generator",
});

// ----------------------
// GENERIC ERROR SCREEN
// ----------------------
function errorScreen(message: string) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#111827",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fecaca",
        fontSize: 26,
        textAlign: "center",
        padding: 40,
      }}
    >
      {message}
    </div>
  );
}

// ----------------------
// STEP 1 — Choose Network
// ----------------------
app.frame("/", (c) => {
  return c.res({
    image: (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#020617",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 32,
        }}
      >
        Choose Network
      </div>
    ),
    intents: [
      <Button value="eth">Ethereum</Button>,
      <Button value="base">Base</Button>,
      <Button value="op">Optimism</Button>,
      <Button value="arb">Arbitrum</Button>,
      <Button value="polygon">Polygon</Button>,
      <Button value="bnb">BNB Chain</Button>,
      <Button value="avax">Avalanche</Button>,
      <Button value="fantom">Fantom</Button>,
      <Button value="gnos">Gnosis</Button>,
    ],
  });
});

// ----------------------
// STEP 2 — input address or ENS
// ----------------------
app.frame("/:network", (c) => {
  const { network } = c.req.param();
  const chain = networks[network as NetworkKey];

  if (!chain) {
    return c.res({
      image: errorScreen("Unknown network. Please start again."),
      intents: [<Button.Reset>Start Over</Button.Reset>],
    });
  }

  return c.res({
    image: (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: chain.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 28,
          textAlign: "center",
          padding: 40,
        }}
      >
        {chain.name} — Enter Address or ENS
      </div>
    ),
    intents: [
      <TextInput placeholder="0x123... or vitalik.eth" />,
      <Button value={network}>Generate</Button>,
    ],
  });
});

// ----------------------
// STEP 3 — QR Output
// ----------------------
app.frame("/:network/qr", async (c) => {
  const { network } = c.req.param();
  const chain = networks[network as NetworkKey];
  let { inputText } = c;

  if (!chain) {
    return c.res({
      image: errorScreen("Unknown network. Please start again."),
      intents: [<Button.Reset>Start Over</Button.Reset>],
    });
  }

  if (!inputText || !inputText.trim()) {
    return c.res({
      image: errorScreen("Address or ENS cannot be empty."),
      intents: [<Button.Reset>Start Over</Button.Reset>],
    });
  }

  inputText = inputText.trim();

  let address = inputText;

  // ENS OR address?
  if (!isValidAddress(address)) {
    const resolved = await resolveENS(address);
    if (!resolved) {
      return c.res({
        image: errorScreen("Invalid ENS name or address."),
        intents: [<Button.Reset>Try Again</Button.Reset>],
      });
    }
    address = resolved;
  }

  const qrURL =
    "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" +
    encodeURIComponent(address);

  return c.res({
    image: (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 24,
        }}
      >
        <img src={qrURL} width={300} height={300} />
        <div style={{ marginTop: 20 }}>
          Powered by AvaPage
        </div>
      </div>
    ),
    intents: [
      <Button.Link href={chain.explorer + address}>
        View on Explorer
      </Button.Link>,
      <Button.Reset>New QR</Button.Reset>,
    ],
  });
});

export const GET = handle(app);
export const POST = handle(app);
