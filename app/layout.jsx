export const metadata = {
  title: "DigiMap SG — Free Digital Roadmap for Singapore SMEs",
  description: "Get your personalised 12-month digitalisation roadmap in 2 minutes. PSG grant-aware, SkillsFuture-aligned. Free.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#07070f" }}>
        {children}
      </body>
    </html>
  );
}
