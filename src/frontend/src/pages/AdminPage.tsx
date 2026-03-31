import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Key,
  Loader2,
  LogOut,
  Mail,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmployeeStatus, type InductionForm } from "../backend";
import { createActorWithConfig } from "../config";

const TOKEN_KEY = "admin_token";
const DATES_KEY = "employee_dates";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getDatesStore(): Record<string, { joining: string; leaving: string }> {
  try {
    return JSON.parse(localStorage.getItem(DATES_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveDatesStore(
  store: Record<string, { joining: string; leaving: string }>,
) {
  localStorage.setItem(DATES_KEY, JSON.stringify(store));
}

function statusBadge(status: EmployeeStatus) {
  if (status === EmployeeStatus.active)
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        Active
      </Badge>
    );
  if (status === EmployeeStatus.inactive)
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200">Inactive</Badge>
    );
  return (
    <Badge className="bg-orange-100 text-orange-700 border-orange-200">
      Pending
    </Badge>
  );
}

function formIdFromSubmittedAt(submittedAt: bigint) {
  return `form_${submittedAt.toString()}`;
}

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const LOGO_URL = "/assets/generated/infinexy-logo.png";

async function printEmployeeForm(form: InductionForm) {
  const logoB64 = await urlToBase64(LOGO_URL);

  const formId = formIdFromSubmittedAt(form.submittedAt);
  const datesStore = getDatesStore();
  const dates = datesStore[formId] ?? { joining: "", leaving: "" };

  // Fetch passport photo
  let passportSrc = "";
  if (form.kyc.passportPhoto) {
    const url = form.kyc.passportPhoto.getDirectURL();
    const b64 = await urlToBase64(url);
    if (b64) passportSrc = b64;
  }

  // Fetch document images
  type DocEntry = { label: string; src: string };
  const docDefs = [
    { label: "10th Certificate", blob: form.education.cert10 },
    { label: "12th Certificate", blob: form.education.cert12 },
    { label: "Diploma", blob: form.education.diploma },
    { label: "Bachelor Degree", blob: form.education.bachelor },
    { label: "Master Degree", blob: form.education.master },
    {
      label: "Experience Certificate",
      blob: form.workProfile.experienceCertificate,
    },
    { label: "Relieving Letter", blob: form.workProfile.relievingLetter },
    { label: "Salary Slip 1", blob: form.workProfile.salarySlip1 },
    { label: "Salary Slip 2", blob: form.workProfile.salarySlip2 },
    { label: "Salary Slip 3", blob: form.workProfile.salarySlip3 },
    { label: "Cancelled Cheque", blob: form.bankDetails.cancelledCheque },
    { label: "Aadhaar Card", blob: form.kyc.aadhaarCard },
    { label: "PAN Card", blob: form.kyc.panCard },
  ].filter((d) => !!d.blob);

  const docEntries: DocEntry[] = [];
  for (const d of docDefs) {
    if (d.blob) {
      const b64 = await urlToBase64(d.blob.getDirectURL());
      if (b64) docEntries.push({ label: d.label, src: b64 });
    }
  }

  const field = (label: string, value: string) =>
    `<tr><td class="field-label">${label}</td><td class="field-value">${value || "—"}</td></tr>`;

  const docsHtml = docEntries
    .map(
      (d) => `
      <div class="doc-page">
        <div class="doc-header">
          ${logoB64 ? `<img src="${logoB64}" class="doc-logo" alt="Infinexy" />` : ""}
          <div>
            <div class="doc-company">INFINEXY SOLUTION</div>
            <div class="doc-title">${d.label}</div>
          </div>
        </div>
        <div class="doc-divider"></div>
        <div class="doc-img-wrap">
          <img src="${d.src}" class="doc-img" alt="${d.label}" />
        </div>
      </div>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Employee Induction Form – ${form.personalInfo.fullName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1a1a2e; background: #fff; font-size: 11pt; }

  /* ── Header ── */
  .header { display: flex; align-items: center; gap: 18px; padding: 24px 40px 16px; border-bottom: 3px solid #1e3a8a; }
  .header-logo { width: auto; height: 44px; object-fit: contain; }
  .header-text { flex: 1; }
  .company-name { font-size: 20pt; font-weight: 800; color: #1e3a8a; letter-spacing: 1px; text-transform: uppercase; }
  .company-tagline { font-size: 9pt; color: #64748b; margin-top: 2px; }
  .doc-form-title { font-size: 14pt; font-weight: 700; color: #334155; margin-top: 4px; }

  /* ── Passport photo strip ── */
  .photo-strip { display: flex; justify-content: flex-end; padding: 12px 40px 0; }
  .passport-frame { border: 2px solid #1e3a8a; padding: 3px; width: 90px; height: 110px; }
  .passport-frame img { width: 100%; height: 100%; object-fit: cover; }
  .passport-label { font-size: 8pt; color: #1e3a8a; text-align: center; margin-top: 3px; font-weight: 600; }

  /* ── Sections ── */
  .section { margin: 14px 40px 0; page-break-inside: avoid; }
  .section-title { background: #1e3a8a; color: #fff; padding: 5px 12px; font-size: 9.5pt; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; border-radius: 2px; margin-bottom: 0; }
  .section table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; }
  .field-label { background: #f1f5f9; color: #475569; font-weight: 600; font-size: 9pt; padding: 5px 12px; width: 38%; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .field-value { color: #1e293b; font-size: 9.5pt; padding: 5px 12px; border-bottom: 1px solid #e2e8f0; }

  /* ── Footer ── */
  .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding: 10px 40px; display: flex; justify-content: space-between; font-size: 8pt; color: #94a3b8; }

  /* ── Document pages ── */
  .doc-page { page-break-before: always; padding: 24px 40px; }
  .doc-header { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
  .doc-logo { width: auto; height: 32px; object-fit: contain; }
  .doc-company { font-size: 14pt; font-weight: 800; color: #1e3a8a; text-transform: uppercase; }
  .doc-title { font-size: 11pt; font-weight: 600; color: #334155; }
  .doc-divider { border-top: 2px solid #1e3a8a; margin-bottom: 16px; }
  .doc-img-wrap { text-align: center; }
  .doc-img { max-width: 100%; max-height: 220mm; object-fit: contain; border: 1px solid #e2e8f0; }

  @media print {
    @page { size: A4; margin: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    ${logoB64 ? `<img src="${logoB64}" class="header-logo" alt="Infinexy" />` : ""}
    <div class="header-text">
      <div class="company-name">Infinexy Solution</div>
      <div class="company-tagline">HR Management &amp; Employee Induction Portal</div>
      <div class="doc-form-title">Employee Induction Form</div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#64748b;">
      <div>Date: ${new Date(Number(form.submittedAt) / 1_000_000).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div>
      ${form.employeeId ? `<div style="margin-top:4px;">Emp ID: <strong>${form.employeeId}</strong></div>` : ""}
    </div>
  </div>

  <!-- Passport Photo -->
  ${
    passportSrc
      ? `
  <div class="photo-strip">
    <div>
      <div class="passport-frame"><img src="${passportSrc}" alt="Passport Photo" /></div>
      <div class="passport-label">Passport Photo</div>
    </div>
  </div>`
      : ""
  }

  <!-- Personal Information -->
  <div class="section">
    <div class="section-title">Personal Information</div>
    <table>
      ${field("Full Name", form.personalInfo.fullName)}
      ${field("Date of Birth", form.personalInfo.dob)}
      ${field("Gender", form.personalInfo.gender)}
      ${field("Phone", form.personalInfo.phone)}
      ${field("Alternate Phone", form.personalInfo.alternatePhone)}
      ${field("Email", form.personalInfo.email)}
      ${field("Address", form.personalInfo.address)}
    </table>
  </div>

  <!-- Work Profile -->
  <div class="section">
    <div class="section-title">Work Profile</div>
    <table>
      ${field("Posts Applying", form.workProfile.postsApplying.join(", "))}
      ${field("Types of Calling", form.workProfile.typesOfCalling.join(", "))}
      ${field("Has Experience", form.workProfile.hasExperience ? "Yes" : "No")}
      ${form.workProfile.hasExperience ? field("Experience Details", form.workProfile.experienceDetails) : ""}
    </table>
  </div>

  <!-- Education -->
  <div class="section">
    <div class="section-title">Education</div>
    <table>
      ${field("Qualification", form.education.qualification)}
    </table>
  </div>

  <!-- Bank Details -->
  <div class="section">
    <div class="section-title">Bank Details</div>
    <table>
      ${field("Bank Name", form.bankDetails.bankName)}
      ${field("Account Holder", form.bankDetails.accountHolder)}
      ${field("Account Number", form.bankDetails.accountNumber)}
      ${field("IFSC Code", form.bankDetails.ifscCode)}
      ${form.bankDetails.upiId ? field("UPI ID", form.bankDetails.upiId) : ""}
    </table>
  </div>

  <!-- KYC -->
  <div class="section">
    <div class="section-title">KYC Details</div>
    <table>
      ${field("Aadhaar Number", form.kyc.aadhaarNumber)}
      ${field("PAN Number", form.kyc.panNumber)}
    </table>
  </div>

  <!-- Admin / Employment Info -->
  <div class="section">
    <div class="section-title">Employment Information</div>
    <table>
      ${field("Employee ID", form.employeeId ?? "Not assigned")}
      ${field("Status", form.status)}
      ${field("Date of Joining", dates.joining || "Not set")}
      ${field("Date of Leaving", dates.leaving || "Not set")}
      ${field("Declaration Date", form.declaration.date)}
    </table>
  </div>

  <div class="footer">
    <span>INFINEXY SOLUTION – Confidential HR Document</span>
    <span>Printed: ${new Date().toLocaleString()}</span>
  </div>

  <!-- Documents (one per page) -->
  ${docsHtml}

</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
  }, 600);
}

async function printAcceptanceLetter(form: InductionForm) {
  const logoB64 = await urlToBase64(LOGO_URL);

  const today = form.declaration.date
    ? new Date(form.declaration.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  const empId = form.employeeId ?? "[To be assigned]";
  const post = form.workProfile.postsApplying[0] ?? "[Designation]";
  const fullName = form.personalInfo.fullName;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Employment Terms &amp; Performance Agreement – ${fullName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4 portrait; margin: 15mm 20mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; font-size: 9pt; line-height: 1.4; }
  .page { width: 100%; }

  /* Top border */
  .top-border { border-top: 2.5px solid #1a2e5a; margin-bottom: 6px; }

  /* Letterhead */
  .letterhead { display: flex; align-items: center; justify-content: space-between; padding: 4px 0 6px; border-bottom: 1px solid #1a2e5a; margin-bottom: 6px; }
  .letterhead-left { display: flex; align-items: center; gap: 8px; }
  .letterhead-logo { width: auto; height: 36px; object-fit: contain; }
  .letterhead-right { text-align: right; }
  .company-name { font-size: 13pt; font-weight: 700; color: #1a2e5a; letter-spacing: 1px; text-transform: uppercase; }
  .company-sub { font-size: 7.5pt; color: #555; margin-top: 1px; }

  /* Document title */
  .doc-title { text-align: center; font-size: 11pt; font-weight: 700; color: #1a2e5a; text-transform: uppercase; letter-spacing: 1px; margin: 6px 0 5px; text-decoration: underline; }

  /* Employee info table */
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 9pt; }
  .info-table td { padding: 2px 6px; }
  .info-table .lbl { font-weight: 700; color: #1a2e5a; width: 22%; white-space: nowrap; }
  .info-table .colon { width: 2%; }
  .info-table .val { color: #000; }

  /* Subject */
  .subject-line { font-size: 9pt; font-weight: 700; margin-bottom: 4px; }
  .intro { font-size: 9pt; color: #000; text-align: justify; margin-bottom: 6px; }

  /* Clauses */
  .clause { margin-bottom: 5px; }
  .clause-title { font-weight: 700; font-size: 9pt; color: #1a2e5a; margin-bottom: 2px; }
  .clause-body { font-size: 9pt; color: #000; text-align: justify; margin-bottom: 2px; }
  .sub-item { margin: 2px 0 2px 12px; font-size: 9pt; }
  .sub-label { font-weight: 700; }

  /* Declaration */
  .declaration-section { margin-top: 6px; border-top: 1px solid #1a2e5a; padding-top: 5px; }
  .declaration-title { font-weight: 700; font-size: 9.5pt; color: #1a2e5a; text-transform: uppercase; margin-bottom: 4px; }
  .acceptance-text { font-size: 9pt; color: #000; text-align: justify; margin-bottom: 8px; }
  .sig-row { display: flex; gap: 24px; margin-top: 8px; }
  .sig-block { flex: 1; }
  .sig-line { border-bottom: 1px solid #000; height: 18px; margin-bottom: 2px; }
  .sig-label { font-size: 8pt; color: #333; }

  /* Footer */
  .footer { border-top: 1px solid #1a2e5a; margin-top: 8px; padding-top: 3px; display: flex; justify-content: space-between; font-size: 7.5pt; color: #555; }
  .bottom-border { border-bottom: 2.5px solid #1a2e5a; margin-top: 3px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="top-border"></div>

  <div class="letterhead">
    <div class="letterhead-left">
      ${logoB64 ? `<img src="${logoB64}" class="letterhead-logo" alt="Infinexy" />` : ""}
    </div>
    <div class="letterhead-right">
      <div class="company-name">Infinexy Solutions</div>
      <div class="company-sub">HR Department &nbsp;|&nbsp; Human Resources &amp; Workforce Management</div>
    </div>
  </div>

  <div class="doc-title">Employment Terms &amp; Performance Agreement</div>

  <table class="info-table">
    <tr><td class="lbl">Date</td><td class="colon">:</td><td class="val">${today}</td><td class="lbl">Employee Name</td><td class="colon">:</td><td class="val">${fullName}</td></tr>
    <tr><td class="lbl">Employee ID</td><td class="colon">:</td><td class="val">${empId}</td><td class="lbl">Position</td><td class="colon">:</td><td class="val">${post}</td></tr>
  </table>

  <div class="subject-line">Subject: Formal Acceptance of Performance and Confidentiality Terms</div>
  <div class="intro">This document serves as a binding agreement between <strong>Infinexy Solutions</strong> (the &ldquo;Company&rdquo;) and <strong>${fullName}</strong> (the &ldquo;Employee&rdquo;). By signing this letter, the Employee acknowledges and agrees to the following specific terms and conditions governing their employment:</div>

  <div class="clause">
    <div class="clause-title">1. Performance-Linked Salary Structure</div>
    <div class="clause-body">The Employee understands that their role is target-driven. The monthly salary is contingent upon the successful completion of the assigned Loan Disbursement Targets.</div>
    <div class="sub-item"><span class="sub-label">Target Achievement:</span> The Employee is required to achieve 100% of the monthly loan disbursement target as set by the management.</div>
    <div class="sub-item"><span class="sub-label">Penalty for Non-Completion:</span> In the event the Employee fails to achieve the assigned monthly loan target, the Employee shall be entitled to receive only 20% (twenty percent) of their total gross monthly salary. The remaining 80% is considered performance-contingent and will be forfeited for that month.</div>
  </div>

  <div class="clause">
    <div class="clause-title">2. Data Security and Confidentiality</div>
    <div class="clause-body">The Employee will have access to sensitive company data, including client financial records, lead databases, and proprietary lending algorithms.</div>
    <div class="sub-item"><span class="sub-label">Non-Disclosure:</span> The Employee agrees to maintain strict confidentiality. No data shall be copied, transferred, or shared with third parties without written authorization.</div>
    <div class="sub-item"><span class="sub-label">Liability for Data Theft:</span> If the Employee is found responsible for any data theft, unauthorized data transfer, or breach of company digital security, they shall be legally bound to pay a penalty of Rs. 1,00,000 (One Lakh Rupees) to the Company.</div>
    <div class="sub-item"><span class="sub-label">Legal Action:</span> This penalty is independent of any further criminal or civil legal proceedings the Company may initiate to recover damages.</div>
  </div>

  <div class="clause">
    <div class="clause-title">3. General Terms &amp; Conditions</div>
    <div class="clause-body">The Employee agrees to abide by all other standard operating procedures, codes of conduct, and internal policies of the Company as updated from time to time.</div>
  </div>

  <div class="declaration-section">
    <div class="declaration-title">Declaration &amp; Acceptance</div>
    <div class="acceptance-text">I, <strong>${fullName}</strong>, have read and fully understood the terms mentioned above. I voluntarily agree to the performance-linked salary structure (including the 20% payout clause for missed targets) and the financial liability of Rs. 1,00,000 in the event of a data breach or theft.</div>
    <div class="sig-row">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Employee Signature</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Date</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Witness Signature</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>Infinexy Solutions &ndash; Confidential Employee Document</span>
    <span>Page 1 of 1</span>
  </div>
  <div class="bottom-border"></div>
</div>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 600);
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(getToken);

  if (!token) {
    return (
      <LoginPage
        onLogin={(t) => {
          localStorage.setItem(TOKEN_KEY, t);
          setToken(t);
        }}
      />
    );
  }
  return (
    <Dashboard
      token={token}
      onLogout={() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }}
    />
  );
}

function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const actor = await createActorWithConfig();
      const t = await actor.adminLogin(username, password);
      onLogin(t);
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center p-6">
      <div
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm"
        data-ocid="admin.login.panel"
      >
        <div className="text-center mb-6">
          <img
            src="/assets/generated/infinexy-logo.png"
            alt="Infinexy"
            className="h-12 w-auto object-contain mx-auto mb-3"
          />
          <h1 className="text-xl font-bold text-navy-700">Admin Portal</h1>
          <p className="text-gray-400 text-sm">
            Infinexy Solution HR Management
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Username</Label>
            <Input
              data-ocid="admin.username.input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Password</Label>
            <Input
              data-ocid="admin.password.input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          {error && (
            <p
              className="text-red-500 text-sm"
              data-ocid="admin.login.error_state"
            >
              {error}
            </p>
          )}
          <Button
            className="w-full bg-navy-600 hover:bg-navy-700 text-white"
            onClick={handleLogin}
            disabled={loading}
            data-ocid="admin.login.submit_button"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({
  token,
  onLogout,
}: { token: string; onLogout: () => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedForm, setSelectedForm] = useState<InductionForm | null>(null);
  const [changePassOpen, setChangePassOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const actor = await createActorWithConfig();
      return actor.getTotalStats();
    },
  });

  const {
    data: submissions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["submissions", token],
    queryFn: async () => {
      const actor = await createActorWithConfig();
      return actor.getAllSubmissions(token);
    },
  });

  const filtered = submissions.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.personalInfo.fullName.toLowerCase().includes(q) ||
      s.personalInfo.phone.includes(q)
    );
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: { id: string; status: EmployeeStatus }) => {
      const actor = await createActorWithConfig();
      return actor.updateStatus(token, id, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const assignId = useMutation({
    mutationFn: async ({ id, empId }: { id: string; empId: string }) => {
      const actor = await createActorWithConfig();
      return actor.assignEmployeeId(token, id, empId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      toast.success("Employee ID assigned");
    },
    onError: () => toast.error("Failed to assign ID"),
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const actor = await createActorWithConfig();
      return actor.deleteSubmission(token, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setSelectedForm(null);
      toast.success("Employee record deleted");
    },
    onError: () => toast.error("Failed to delete employee"),
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-navy-600 text-white shadow">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/assets/generated/infinexy-logo.png"
              alt="Infinexy"
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className="font-bold text-lg tracking-wide">
                INFINEXY SOLUTION
              </h1>
              <p className="text-navy-200 text-xs">HR Management Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => setChangePassOpen(true)}
              data-ocid="admin.change_password.button"
            >
              <Key className="w-4 h-4 mr-1" /> Change Password
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={onLogout}
              data-ocid="admin.logout.button"
            >
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 w-full">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Employees",
              value: Number(stats?.total ?? 0),
              icon: Users,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Pending",
              value: Number(stats?.pending ?? 0),
              icon: TrendingUp,
              color: "text-orange-600",
              bg: "bg-orange-50",
            },
            {
              label: "Active",
              value: Number(stats?.active ?? 0),
              icon: UserCheck,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Inactive",
              value: Number(stats?.inactive ?? 0),
              icon: UserX,
              color: "text-red-600",
              bg: "bg-red-50",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
                <div
                  className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Employee Records */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-navy-700">Employee Records</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  data-ocid="admin.search.input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or phone"
                  className="pl-9 w-64 text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                data-ocid="admin.refresh.button"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div
              className="py-16 flex items-center justify-center"
              data-ocid="admin.employees.loading_state"
            >
              <Loader2 className="w-8 h-8 animate-spin text-navy-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="py-16 text-center text-gray-400"
              data-ocid="admin.employees.empty_state"
            >
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No employee records found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-600">
                    Full Name
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Phone
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Post Applied
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Employee ID
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Submitted
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s, i) => (
                  <TableRow
                    key={String(s.submittedAt)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedForm(s)}
                    data-ocid={`admin.employees.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">
                      {s.personalInfo.fullName}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {s.personalInfo.phone}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {s.workProfile.postsApplying[0] ?? "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {s.employeeId ?? (
                        <span className="text-gray-300 italic">
                          Not assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell className="text-gray-400 text-xs">
                      {new Date(
                        Number(s.submittedAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Employee Detail Dialog */}
      {selectedForm && (
        <EmployeeDetailDialog
          form={selectedForm}
          token={token}
          onClose={() => setSelectedForm(null)}
          onStatusChange={(status) => {
            const id = formIdFromSubmittedAt(selectedForm.submittedAt);
            updateStatus.mutate({ id, status });
          }}
          onAssignId={(empId) => {
            const id = formIdFromSubmittedAt(selectedForm.submittedAt);
            assignId.mutate({ id, empId });
          }}
          onDelete={() => {
            const id = formIdFromSubmittedAt(selectedForm.submittedAt);
            deleteEmployee.mutate(id);
          }}
          isDeleting={deleteEmployee.isPending}
        />
      )}

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePassOpen}
        onClose={() => setChangePassOpen(false)}
        token={token}
      />

      <footer className="mt-auto py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="hover:text-navy-600 underline"
          target="_blank"
          rel="noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

function EmployeeDetailDialog({
  form,
  onClose,
  onStatusChange,
  onAssignId,
  onDelete,
  isDeleting,
}: {
  form: InductionForm;
  token: string;
  onClose: () => void;
  onStatusChange: (s: EmployeeStatus) => void;
  onAssignId: (id: string) => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [empId, setEmpId] = useState(form.employeeId ?? "");
  const [printing, setPrinting] = useState(false);
  const [printingLetter, setPrintingLetter] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formId = formIdFromSubmittedAt(form.submittedAt);
  const datesStore = getDatesStore();
  const existingDates = datesStore[formId] ?? { joining: "", leaving: "" };
  const [dateJoining, setDateJoining] = useState(existingDates.joining);
  const [dateLeaving, setDateLeaving] = useState(existingDates.leaving);
  const [savingDates, setSavingDates] = useState(false);

  const handleSaveDates = () => {
    setSavingDates(true);
    const store = getDatesStore();
    store[formId] = { joining: dateJoining, leaving: dateLeaving };
    saveDatesStore(store);
    setTimeout(() => {
      setSavingDates(false);
      toast.success("Dates saved successfully");
    }, 300);
  };

  const handlePrintForm = async () => {
    setPrinting(true);
    try {
      await printEmployeeForm(form);
    } catch {
      toast.error("Failed to open print view");
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintLetter = async () => {
    setPrintingLetter(true);
    try {
      await printAcceptanceLetter(form);
    } catch {
      toast.error("Failed to open acceptance letter");
    } finally {
      setPrintingLetter(false);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
          data-ocid="admin.employee.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-navy-700">
              {form.personalInfo.fullName}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="details" className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Employee Details
              </TabsTrigger>
              <TabsTrigger value="letter" className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Acceptance Letter
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Employee Details ── */}
            <TabsContent value="details" className="space-y-4 text-sm">
              <Section title="Personal Information">
                <Row label="DOB" value={form.personalInfo.dob} />
                <Row label="Gender" value={form.personalInfo.gender} />
                <Row label="Phone" value={form.personalInfo.phone} />
                <Row
                  label="Alternate Phone"
                  value={form.personalInfo.alternatePhone}
                />
                <Row label="Email" value={form.personalInfo.email} />
                <Row label="Address" value={form.personalInfo.address} />
              </Section>
              <Section title="Work Profile">
                <Row
                  label="Posts"
                  value={form.workProfile.postsApplying.join(", ")}
                />
                <Row
                  label="Types of Calling"
                  value={form.workProfile.typesOfCalling.join(", ")}
                />
                <Row
                  label="Has Experience"
                  value={form.workProfile.hasExperience ? "Yes" : "No"}
                />
              </Section>
              <Section title="Education">
                <Row
                  label="Qualification"
                  value={form.education.qualification}
                />
              </Section>
              <Section title="Bank Details">
                <Row label="Bank" value={form.bankDetails.bankName} />
                <Row
                  label="Account Holder"
                  value={form.bankDetails.accountHolder}
                />
                <Row
                  label="Account No."
                  value={form.bankDetails.accountNumber}
                />
                <Row label="IFSC" value={form.bankDetails.ifscCode} />
              </Section>
              <Section title="KYC">
                <Row label="Aadhaar" value={form.kyc.aadhaarNumber} />
                <Row label="PAN" value={form.kyc.panNumber} />
              </Section>

              {/* Admin Actions */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-navy-700 mb-3">
                  Admin Actions
                </h4>

                {/* Status & Employee ID */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">
                      Update Status
                    </Label>
                    <Select
                      defaultValue={form.status}
                      onValueChange={(v) => onStatusChange(v as EmployeeStatus)}
                    >
                      <SelectTrigger data-ocid="admin.employee.status.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EmployeeStatus.pending}>
                          Pending
                        </SelectItem>
                        <SelectItem value={EmployeeStatus.active}>
                          Active
                        </SelectItem>
                        <SelectItem value={EmployeeStatus.inactive}>
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">
                      Assign Employee ID
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        data-ocid="admin.employee.empid.input"
                        value={empId}
                        onChange={(e) => setEmpId(e.target.value)}
                        placeholder="e.g. EMP001"
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        className="bg-navy-600 hover:bg-navy-700 text-white"
                        onClick={() => onAssignId(empId)}
                        data-ocid="admin.employee.assign_id.button"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Date of Joining & Leaving */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h5 className="text-xs font-semibold text-navy-700 mb-3 uppercase tracking-wide">
                    Employment Dates
                  </h5>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">
                        Date of Joining
                      </Label>
                      <Input
                        type="date"
                        data-ocid="admin.employee.joining_date.input"
                        value={dateJoining}
                        onChange={(e) => setDateJoining(e.target.value)}
                        className="text-sm bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">
                        Date of Leaving (Future)
                      </Label>
                      <Input
                        type="date"
                        data-ocid="admin.employee.leaving_date.input"
                        value={dateLeaving}
                        onChange={(e) => setDateLeaving(e.target.value)}
                        className="text-sm bg-white"
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-navy-600 hover:bg-navy-700 text-white"
                    onClick={handleSaveDates}
                    disabled={savingDates}
                    data-ocid="admin.employee.save_dates.button"
                  >
                    {savingDates ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : null}
                    Save Dates
                  </Button>
                </div>

                {/* Print & Delete */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    className="bg-navy-600 hover:bg-navy-700 text-white"
                    onClick={handlePrintForm}
                    disabled={printing}
                    data-ocid="admin.employee.print_form.button"
                  >
                    {printing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Printer className="w-4 h-4 mr-2" />
                    )}
                    {printing ? "Preparing..." : "Print Form"}
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => setConfirmDelete(true)}
                    disabled={isDeleting}
                    data-ocid="admin.employee.delete_button"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Employee
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 2: Acceptance Letter ── */}
            <TabsContent value="letter" className="text-sm">
              <div className="border rounded-xl overflow-hidden">
                {/* Letter Preview */}
                <div className="bg-gradient-to-b from-blue-50 to-white p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src="/assets/generated/infinexy-logo.png"
                      alt="Infinexy"
                      className="h-10 w-auto object-contain"
                    />
                    <div>
                      <div className="font-black text-navy-700 text-base uppercase tracking-widest">
                        Infinexy Solution
                      </div>
                      <div className="text-xs text-gray-400">
                        Human Resources Department
                      </div>
                    </div>
                  </div>
                  <div className="border-t-2 border-blue-800 pt-4">
                    <div className="text-center font-black text-blue-900 text-sm uppercase tracking-widest underline mb-4">
                      Employment Terms &amp; Performance Agreement
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs mb-4">
                      <span className="text-blue-800 font-bold">Date:</span>
                      <span className="text-gray-700">
                        {form.declaration.date
                          ? new Date(form.declaration.date).toLocaleDateString()
                          : new Date().toLocaleDateString()}
                      </span>
                      <span className="text-blue-800 font-bold">
                        Employee Name:
                      </span>
                      <span className="text-gray-700">
                        {form.personalInfo.fullName}
                      </span>
                      <span className="text-blue-800 font-bold">
                        Employee ID:
                      </span>
                      <span className="text-gray-700">
                        {form.employeeId ?? "[To be assigned]"}
                      </span>
                      <span className="text-blue-800 font-bold">Position:</span>
                      <span className="text-gray-700">
                        {form.workProfile.postsApplying[0] ?? "—"}
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-700 mb-1">
                        <strong>Subject:</strong> Formal Acceptance of
                        Performance and Confidentiality Terms
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        This document serves as a binding agreement between{" "}
                        <strong>Infinexy Solution</strong> (the
                        &ldquo;Company&rdquo;) and{" "}
                        <strong>{form.personalInfo.fullName}</strong> (the
                        &ldquo;Employee&rdquo;). By signing this letter, the
                        Employee acknowledges and agrees to the following
                        specific terms and conditions governing their
                        employment:
                      </p>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="text-xs font-black text-blue-800 uppercase">
                          1. Performance-Linked Salary Structure
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          The Employee understands that their role is
                          target-driven. The monthly salary is contingent upon
                          the successful completion of the assigned Loan
                          Disbursement Targets.
                          <br />
                          <br />
                          <strong>Target Achievement:</strong> The Employee is
                          required to achieve 100% of the monthly loan
                          disbursement target as set by the management.
                          <br />
                          <br />
                          <strong>Penalty for Non-Completion:</strong> In the
                          event the Employee fails to achieve the assigned
                          monthly loan target, the Employee shall be entitled to
                          receive only 20% (twenty percent) of their total gross
                          monthly salary. The remaining 80% is considered
                          performance-contingent and will be forfeited for that
                          month.
                        </p>
                      </div>
                      <div>
                        <div className="text-xs font-black text-blue-800 uppercase">
                          2. Data Security and Confidentiality
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          The Employee will have access to sensitive company
                          data, including client financial records, lead
                          databases, and proprietary lending algorithms.
                          <br />
                          <br />
                          <strong>Non-Disclosure:</strong> The Employee agrees
                          to maintain strict confidentiality. No data shall be
                          copied, transferred, or shared with third parties
                          without written authorization.
                          <br />
                          <br />
                          <strong>Liability for Data Theft:</strong> If the
                          Employee is found responsible for any data theft,
                          unauthorized data transfer, or breach of company
                          digital security, they shall be legally bound to pay a
                          penalty of Rs. 1,00,000 (One Lakh Rupees) to the
                          Company.
                          <br />
                          <br />
                          <strong>Legal Action:</strong> This penalty is
                          independent of any further criminal or civil legal
                          proceedings the Company may initiate to recover
                          damages.
                        </p>
                      </div>
                      <div>
                        <div className="text-xs font-black text-blue-800 uppercase">
                          3. General Terms &amp; Conditions
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          The Employee agrees to abide by all other standard
                          operating procedures, codes of conduct, and internal
                          policies of the Company as updated from time to time.
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-blue-200 pt-3">
                      <div className="text-xs font-black text-blue-800 uppercase mb-2">
                        Declaration &amp; Acceptance
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">
                        I, <strong>{form.personalInfo.fullName}</strong>, have
                        read and fully understood the terms mentioned above. I
                        voluntarily agree to the performance-linked salary
                        structure (including the 20% payout clause for missed
                        targets) and the financial liability of Rs. 1,00,000 in
                        the event of a data breach or theft.
                      </p>
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="border-b border-blue-800 w-48 mb-1">
                            &nbsp;
                          </div>
                          <div className="text-xs text-gray-500">
                            Employee Signature: __________________________
                          </div>
                        </div>
                        <div>
                          <div className="border-b border-blue-800 w-48 mb-1">
                            &nbsp;
                          </div>
                          <div className="text-xs text-gray-500">
                            Date: _______________________________
                          </div>
                        </div>
                        <div>
                          <div className="border-b border-blue-800 w-48 mb-1">
                            &nbsp;
                          </div>
                          <div className="text-xs text-gray-500">
                            Witness Signature: __________________________
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print Button */}
                <div className="bg-white border-t px-6 py-4 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Opens a professional print-ready acceptance letter in a new
                    tab
                  </div>
                  <Button
                    className="bg-navy-600 hover:bg-navy-700 text-white"
                    onClick={handlePrintLetter}
                    disabled={printingLetter}
                    data-ocid="admin.employee.print_letter.button"
                  >
                    {printingLetter ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Printer className="w-4 h-4 mr-2" />
                    )}
                    {printingLetter
                      ? "Preparing..."
                      : "Print Acceptance Letter"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <Dialog open onOpenChange={(o) => !o && setConfirmDelete(false)}>
          <DialogContent className="max-w-sm" data-ocid="admin.delete.dialog">
            <DialogHeader>
              <DialogTitle className="text-red-600">
                Delete Employee?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 mb-4">
              This will permanently delete the record for{" "}
              <strong>{form.personalInfo.fullName}</strong>. This action cannot
              be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                data-ocid="admin.delete.cancel_button"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete();
                }}
                disabled={isDeleting}
                data-ocid="admin.delete.confirm_button"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Yes, Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function Section({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold text-navy-700 text-xs uppercase tracking-wide mb-2 bg-navy-600/5 px-2 py-1 rounded">
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 min-w-24 shrink-0">{label}:</span>
      <span className="text-gray-800 font-medium truncate">{value || "—"}</span>
    </div>
  );
}

function ChangePasswordDialog({
  open,
  onClose,
  token,
}: { open: boolean; onClose: () => void; token: string }) {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!pw.trim()) return;
    setLoading(true);
    try {
      const actor = await createActorWithConfig();
      await actor.changePassword(token, pw);
      toast.success("Password changed successfully");
      onClose();
      setPw("");
    } catch {
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-sm"
        data-ocid="admin.change_password.dialog"
      >
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm">New Password</Label>
            <Input
              data-ocid="admin.new_password.input"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Enter new password"
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && handleChange()}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              data-ocid="admin.change_password.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="bg-navy-600 hover:bg-navy-700 text-white"
              onClick={handleChange}
              disabled={loading}
              data-ocid="admin.change_password.confirm_button"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
