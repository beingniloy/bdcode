import { EditorSettings } from './types';

/** A single setting definition used to render the UI form */
export interface SettingDef {
  id: keyof EditorSettings;
  label: string;
  /** Bilingual label shown in the settings editor (bn / en) */
  labelBn: string;
  labelEn: string;
  descBn: string;
  descEn: string;
  section: 'editor' | 'workbench' | 'security' | 'terminal' | 'cloud';
  type: 'number' | 'select' | 'checkbox' | 'text';
  min?: number;
  max?: number;
  options?: { label: string; value: string | number }[];
}

export const SETTINGS_DEF: SettingDef[] = [
  // ── Editor ────────────────────────────────────────
  { id: 'fontSize',            section: 'editor', type: 'number', min: 10, max: 30,
    labelBn: 'এডিটর ফন্ট সাইজ (Font Size)',       labelEn: 'Editor: Font Size',
    descBn: 'এডিটর লেখার অক্ষরের আকার (পিক্সেল).', descEn: 'Controls the font size in pixels.' },
  { id: 'fontFamily',          section: 'editor', type: 'select',
    labelBn: 'ফন্ট ফ্যামিলি (Font Family)',         labelEn: 'Editor: Font Family',
    descBn: 'কোড ফন্ট ফ্যামিলি কাস্টমাইজ করুন।',   descEn: 'Controls the font family name.',
    options: [
      { label: 'JetBrains Mono', value: 'JetBrains Mono' },
      { label: 'Cascadia Code',  value: 'Cascadia Code' },
      { label: 'Fira Code',      value: 'Fira Code' },
      { label: 'Consolas',       value: 'Consolas' },
    ] },
  { id: 'tabSize',             section: 'editor', type: 'select',
    labelBn: 'ট্যাব সাইজ (Tab Size)',               labelEn: 'Editor: Tab Size',
    descBn: 'ট্যাব কি চাপলে কতটি স্পেস ফাঁকা হবে।',  descEn: 'The number of spaces a tab is equal to.',
    options: [{ label: '2', value: 2 }, { label: '4', value: 4 }, { label: '8', value: 8 }] },
  { id: 'wordWrap',            section: 'editor', type: 'select',
    labelBn: 'ওয়ার্ড র‍্যাপ (Word Wrap)',           labelEn: 'Editor: Word Wrap',
    descBn: 'এডিটরের লেখা উইন্ডো সাইজ অনুযায়ী নিচের লাইনে চলে যাবে।', descEn: 'Controls how lines should wrap.',
    options: [{ label: 'On', value: 'on' }, { label: 'Off', value: 'off' }, { label: 'Bounded', value: 'bounded' }] },
  { id: 'minimap',             section: 'editor', type: 'checkbox',
    labelBn: 'মিনিম্যাপ প্রদর্শন (Show Minimap)',    labelEn: 'Editor: Show Minimap',
    descBn: 'কোডের ডান পাশে ছোট আউটলাইন ম্যাপ দেখান।', descEn: 'Controls whether the minimap is shown.' },
  { id: 'autoSave',            section: 'editor', type: 'checkbox',
    labelBn: 'অটো সেভ (Autosave Files)',            labelEn: 'Editor: Auto Save',
    descBn: 'ফাইল এডিট করার সাথে সাথে স্বয়ংক্রিয়ভাবে ডিস্কে সেভ হবে।', descEn: 'Automatically saves dirty files after delay.' },
  { id: 'bracketColorization', section: 'editor', type: 'checkbox',
    labelBn: 'ব্র্যাকেট কালার সিঙ্ক (Bracket Colorization)', labelEn: 'Editor: Bracket Colorization',
    descBn: 'ম্যাচিং ব্র্যাকেটগুলোতে ভিন্ন ভিন্ন রঙ প্রদর্শন করুন।', descEn: 'Enable colorization of matching bracket pairs.' },
  { id: 'renderWhitespace',    section: 'editor', type: 'select',
    labelBn: 'স্পেস/ট্যাব ডট রেন্ডার (Render Whitespace)', labelEn: 'Editor: Render Whitespace',
    descBn: 'কোডের ফাকা অংশ বা হোয়াইটস্পেস দৃশ্যমান করুন।', descEn: 'Controls how the editor should render whitespace characters.',
    options: [{ label: 'None', value: 'none' }, { label: 'Boundary', value: 'boundary' }, { label: 'All', value: 'all' }] },

  // ── Workbench ─────────────────────────────────────
  { id: 'iconTheme',           section: 'workbench', type: 'select',
    labelBn: 'আইকন থিম (Icon Theme)',               labelEn: 'Workbench: Icon Theme',
    descBn: 'ফাইল ও ফোল্ডারের ফাইল আইকন প্যাক পরিবর্তন করুন।', descEn: 'Specifies the file icon theme.',
    options: [{ label: 'Default Government', value: 'default-gov' }, { label: 'VS Code Flat Style', value: 'vscode-flat' }, { label: 'Minimal', value: 'minimal' }] },
  { id: 'colorTheme',          section: 'workbench', type: 'select',
    labelBn: 'কালার থিম (Color Theme)',              labelEn: 'Workbench: Color Theme',
    descBn: 'পুরো উইন্ডোর ব্যাকগ্রাউন্ড কালার থিম পরিবর্তন করুন।', descEn: 'Overall window theme settings.',
    options: [{ label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }] },
  { id: 'sidebarPosition',     section: 'workbench', type: 'select',
    labelBn: 'সাইডবার পজিশন (Sidebar Position)',     labelEn: 'Workbench: Sidebar Position',
    descBn: 'বাম পাশের সাইডবার প্যানেল বামে নাকি ডানে থাকবে।', descEn: 'Controls the layout position of the primary sidebar.',
    options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }] },
  { id: 'statusBarVisible',    section: 'workbench', type: 'checkbox',
    labelBn: 'স্ট্যাটাস বার প্রদর্শন (Show Status Bar)', labelEn: 'Workbench: Show Status Bar',
    descBn: 'নিচের সবুজ স্ট্যাটাস বারটি প্রদর্শন করুন।', descEn: 'Controls the visibility of the status bar.' },

  // ── Security ──────────────────────────────────────
  { id: 'offlineMode',         section: 'security', type: 'checkbox',
    labelBn: 'অফলাইন আইসোলেশন মোড (Offline Mode)',   labelEn: 'Security: Offline Isolation Mode',
    descBn: 'যেকোনো বাহ্যিক ইন্টারনেট কানেকশন বা এপিআই ব্লক করুন।', descEn: 'Run editor in complete network isolation for security.' },
  { id: 'sandboxEnabled',      section: 'security', type: 'checkbox',
    labelBn: 'স্যান্ডবক্সিং সক্ষম করুন (Process Sandboxing)', labelEn: 'Security: Enable Sandboxing',
    descBn: 'কোড রান ও ফাইল অপারেশন সিস্টেম স্যান্ডবক্সে চালান।', descEn: 'Run background processes in restricted sandbox env.' },
  { id: 'blockTelemetry',      section: 'security', type: 'checkbox',
    labelBn: 'টেলিমেক্ট্রি বন্ধ করুন (Block Telemetry)', labelEn: 'Security: Block Telemetry',
    descBn: 'কোনো এনালাইটিক্স বা ব্যবহারকারীর তথ্য পাঠানো সম্পূর্ণ ব্লক করুন।', descEn: 'Block usage statistics and crash logs collection.' },
  { id: 'sslCheck',            section: 'security', type: 'checkbox',
    labelBn: 'SSL যাচাইকরণ (SSL Certification Validation)', labelEn: 'Security: Validate SSL',
    descBn: 'সরকারি পাবলিশ ক্লাউডে ডিপ্লয় করার সময় SSL চেক করুন।', descEn: 'Strictly check certificate authorities during cloud publish.' },

  // ── Terminal ──────────────────────────────────────
  { id: 'terminalFontSize',    section: 'terminal', type: 'number', min: 10, max: 20,
    labelBn: 'টার্মিনাল ফন্ট সাইজ (Terminal Font Size)', labelEn: 'Terminal: Font Size',
    descBn: 'টার্মিনালের লেখার অক্ষরের আকার।',       descEn: 'Controls the font size of the terminal shell.' },
  { id: 'terminalShell',       section: 'terminal', type: 'select',
    labelBn: 'ডিফল্ট কমান্ড শেল (Terminal Shell)',    labelEn: 'Terminal: Active Shell',
    descBn: 'টার্মিনালে ব্যবহৃত মূল কমান্ড প্রম্পট বাইনারি।', descEn: 'Select the default shell path.',
    options: [{ label: 'PowerShell', value: 'powershell.exe' }, { label: 'CMD', value: 'cmd.exe' }] },
  { id: 'terminalCursorStyle', section: 'terminal', type: 'select',
    labelBn: 'টার্মিনাল কার্সর স্টাইল (Terminal Cursor Style)', labelEn: 'Terminal: Cursor Style',
    descBn: 'টার্মিনাল কার্সরের আকার নির্বাচন করুন।', descEn: 'Controls the shape of the terminal cursor.',
    options: [{ label: 'Block', value: 'block' }, { label: 'Line', value: 'line' }, { label: 'Underline', value: 'underline' }] },

  // ── Gov Cloud ─────────────────────────────────────
  { id: 'autoPublish',         section: 'cloud', type: 'checkbox',
    labelBn: 'স্বয়ংক্রিয় পাবলিশ (Auto Publish on Save)', labelEn: 'Cloud: Auto Publish',
    descBn: 'ফাইল সেভ করার সাথে সাথে সরকারি ক্লাউডে ডিপ্লয় ট্রিগার হবে।', descEn: 'Trigger cloud upload pipeline directly on save.' },
  { id: 'nodeEnv',             section: 'cloud', type: 'select',
    labelBn: 'সার্ভার নোড এনভায়রনমেন্ট (Node Environment)', labelEn: 'Cloud: Server Environment',
    descBn: 'টার্গেট ক্লাউড নোডের সার্ভিস লেভেল।',   descEn: 'Target staging or production servers.',
    options: [{ label: 'Development', value: 'development' }, { label: 'Staging', value: 'staging' }, { label: 'Production', value: 'production' }] },
  { id: 'agencyCode',          section: 'cloud', type: 'text',
    labelBn: 'দপ্তর কোড (Agency Department Code)',    labelEn: 'Cloud: Agency Code',
    descBn: 'সরকারি প্রতিষ্ঠানের এনরোলমেন্ট কোড আইডি।', descEn: 'Registration code of government ministry.' },
];

/** Default EditorSettings used for reset-to-defaults */
export const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
  tabSize: 4,
  wordWrap: 'on',
  minimap: true,
  autoSave: false,
  bracketColorization: true,
  renderWhitespace: 'none',
  iconTheme: 'default-gov',
  colorTheme: 'light',
  sidebarPosition: 'left',
  statusBarVisible: true,
  offlineMode: false,
  sandboxEnabled: false,
  blockTelemetry: true,
  sslCheck: true,
  terminalFontSize: 12,
  terminalShell: 'powershell.exe',
  terminalCursorStyle: 'block',
  autoPublish: false,
  nodeEnv: 'development',
  agencyCode: 'GOV-BD-99',
};
