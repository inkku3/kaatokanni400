export const specialEvents = [
  { text: "5min mallasmaraton: 50ml juomaa per PIIP. Alko jo!", handler: "timer", minutes: "5"},
  { text: "2 kierroksen ajan kaikki voivat halutessaan kokeilla klaavalla välttyä juomiselta, tai kruunalla tuplata sen.", handler: "rounds", roundsName: "TUPLA TAI KUITTI", roundLength: "2"},
  { text: "Jos käytät täytesanaa (sillee, öö, siis, yms.) seuraavan 2 kierroksen aikana juot.", handler: "rounds", roundsName: "TÄYTESANA BAN", roundLength: "2"},
  { text: "Kun yksi juo, kaikki juo - 2 kierroksen ajan.", handler: "rounds", roundsName: "KAIKKI JUO", roundLength: "2" },
  { text: "'KEISARI' = juo.", handler: "youtube", videoId: "UfrdOr-OAPA"},
  { text: "'PLEASE' = juo.", handler: "youtube", videoId: "YiQ7qiL73aI"},
  { text: "Ei puhelimia kierrokset! Jokainen laittaa puhelimensa näkyville. Puhelimensa hapuilija juo.", handler: "rounds", roundsName: "EI PUHELIMIA", roundLength: "3"},
  { text: "Valitse kielletty sana, jota ei saa sanoa seuraavan kierroksen aikana! Rangaistus on juominen.", handler: "rounds", roundsName: "KIELLETTY SANA", roundLength: "1"},
  { text: "Kaikki laittavat mitä tahansa hatuksi. Jos jonkun hattu tippuu kierroksen aikana, hän juo.", handler: "rounds", roundsName: "HATTUAIKA", roundLength: "1"},
  { text: "10min mallasmaraton: 50ml juomaa per PIIP. Alko jo!", handler: "timer", minutes: "10"},
  { text: "Ei naurua 2 kierrokseen. Jos nauraa, joutuu ottamaan 3 hörppyä", handler: "rounds", roundsName: "EI NAURUA", roundLength: "2"}
];
