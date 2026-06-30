"use client";

import { useState } from "react";
import {
  User, Bell, Shield, LogOut, Check, Save,
  Building2, Package, MessageSquare, Info
} from "lucide-react";
import { useAuthStore, Role } from "@/store/authStore";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { user, logout, updateUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile fields state
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [branch, setBranch] = useState("Bangalore HQ");
  const [department, setDepartment] = useState("BSD Steel Operations");
  const [role, setRole] = useState<Role>(user?.role || "management");

  // Company Settings state
  const [companyName, setCompanyName] = useState("BSD Steel Private Limited");
  const [gstin, setGstin] = useState("29AABCB1234F1Z5");
  const [currency, setCurrency] = useState("INR");
  const [defaultInwardWH, setDefaultInwardWH] = useState("WH-1");
  const [defaultOutwardWH, setDefaultOutwardWH] = useState("WH-2");

  // Inventory Settings state
  const [safetyBuffer, setSafetyBuffer] = useState("15");
  const [leadTime, setLeadTime] = useState("5");
  const [lowStockNotification, setLowStockNotification] = useState(true);
  const [autoReorderMail, setAutoReorderMail] = useState(false);

  // Alerts & API state
  const [whatsappApiToken, setWhatsappApiToken] = useState("wh_live_a982fd09ce81bc13e");
  const [reminderChannel, setReminderChannel] = useState("whatsapp_email");
  const [reminderTime, setReminderTime] = useState("10:00");
  const [whatsappTemplate, setWhatsappTemplate] = useState("standard_overdue");

  // Security state
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const tabs = [
    { name: "Profile",            icon: User },
    { name: "Company Profile",    icon: Building2 },
    { name: "Inventory Control",  icon: Package },
    { name: "WhatsApp & Alerts",  icon: MessageSquare },
    { name: "Notifications",      icon: Bell },
    { name: "Security & Audits",  icon: Shield },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // Save user profile state back to authStore
      updateUser({
        full_name: fullName,
        email: email,
        role: role
      });
      showToast("All settings saved and applied successfully.");
    }, 800);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 shrink-0 relative z-10">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary tracking-widest uppercase">
            Settings
          </h1>
          <p className="text-text-muted text-sm mt-0.5">Configure operational thresholds, WhatsApp API, and account details</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-accent text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 text-xs"
        >
          {isSaving ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saved" : "Save Changes"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10 gap-8 pb-6">
        {/* Left Sidebar Menu */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-3 w-full p-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-xs font-bold ${
                  isActive 
                    ? "bg-accent/10 text-accent shadow-inner border border-accent/20" 
                    : "text-text-muted hover:bg-white/5 hover:text-text-primary"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-accent" : "text-text-muted"}`} />
                {tab.name}
              </button>
            );
          })}

          <div className="mt-auto pt-8">
            <button 
              onClick={logout}
              className="flex items-center gap-3 w-full p-4 rounded-xl transition-all duration-300 uppercase tracking-widest text-xs font-bold text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 pb-6">
          <div className="bg-panel/40 backdrop-blur-xl border border-border rounded-3xl p-8 min-h-full shadow-2xl relative overflow-hidden">
            {/* Subtle top highlight */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Tab: User Profile */}
            {activeTab === "Profile" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-6 pb-8 border-b border-border/50">
                  <div className="w-24 h-24 rounded-full bg-accent/20 border-2 border-accent/50 flex items-center justify-center text-accent text-3xl font-display font-bold shadow-[0_0_30px_rgba(208,41,54,0.3)]">
                    {fullName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary font-display uppercase tracking-wider mb-1">
                      {fullName || "User"}
                    </h2>
                    <p className="text-accent text-xs uppercase tracking-[0.2em] font-medium">
                      {role.replace('_', ' ')}
                    </p>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider mt-1">
                      {department} · {branch}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Full Name</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Email Address</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Location / Branch</label>
                    <input 
                      type="text" 
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Department</label>
                    <input 
                      type="text" 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Role / Permissions Profile</label>
                    <select 
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    >
                      <option value="management">Management (Full Access)</option>
                      <option value="accounts_team">Accounts Team (Billing / Reminders)</option>
                      <option value="operations">Operations (Inventory Manager)</option>
                      <option value="warehouse_staff">Warehouse Staff (Read / Ledger log only)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-background/40 border border-border p-4 rounded-2xl flex gap-3 text-xs text-text-muted leading-relaxed">
                  <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p>
                    Changing your <strong>Role / Permissions Profile</strong> dynamically adjusts modules and functional buttons across the SKU inventory log and accounts receivable screens to match user attribution requirements.
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Company Profile */}
            {activeTab === "Company Info" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-text-primary uppercase tracking-widest border-b border-border/50 pb-4">
                  Company Configuration
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Company Registered Name</label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">GSTIN Number (for Exports)</label>
                    <input 
                      type="text" 
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Default Base Currency</label>
                    <select 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    >
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Reporting Timezone</label>
                    <select 
                      defaultValue="IST"
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    >
                      <option value="IST">IST (UTC+05:30) - Bangalore</option>
                      <option value="GMT">GMT (UTC+00:00) - London</option>
                      <option value="EST">EST (UTC-05:00) - New York</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Default Inward Warehouse</label>
                    <input 
                      type="text" 
                      value={defaultInwardWH}
                      onChange={(e) => setDefaultInwardWH(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Default Outward Warehouse</label>
                    <input 
                      type="text" 
                      value={defaultOutwardWH}
                      onChange={(e) => setDefaultOutwardWH(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Inventory Control */}
            {activeTab === "Inventory Control" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-text-primary uppercase tracking-widest border-b border-border/50 pb-4">
                  Inventory Rules & Buffers
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Safety Buffer Level (%)</label>
                    <input 
                      type="number" 
                      value={safetyBuffer}
                      onChange={(e) => setSafetyBuffer(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Default Restock Lead Time (Days)</label>
                    <input 
                      type="number" 
                      value={leadTime}
                      onChange={(e) => setLeadTime(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between p-4 bg-background/30 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-bold text-text-primary uppercase tracking-wider">Low Stock Notifications</p>
                      <p className="text-xs text-text-muted">Push alerts to topbar and dashboard when individual SKUs drop below Safety Buffer</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={lowStockNotification} 
                        onChange={(e) => setLowStockNotification(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background/30 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-bold text-text-primary uppercase tracking-wider">Automated Safety Re-orders</p>
                      <p className="text-xs text-text-muted">Send automated purchase request email drafts to suppliers when threshold is broken</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoReorderMail} 
                        onChange={(e) => setAutoReorderMail(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: WhatsApp & Alerts */}
            {activeTab === "WhatsApp & Alerts" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-text-primary uppercase tracking-widest border-b border-border/50 pb-4">
                  WhatsApp Business API & Reminder Engine
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">WhatsApp Cloud API Live Token</label>
                    <input 
                      type="password" 
                      value={whatsappApiToken}
                      onChange={(e) => setWhatsappApiToken(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Default Notification Channel</label>
                    <select 
                      value={reminderChannel}
                      onChange={(e) => setReminderChannel(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    >
                      <option value="whatsapp_email">WhatsApp + Email Reminders</option>
                      <option value="whatsapp_only">WhatsApp Only</option>
                      <option value="email_only">Email Only</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Auto-Run Reminders Scheduled Time</label>
                    <input 
                      type="time" 
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">WhatsApp Reminder Template</label>
                    <select 
                      value={whatsappTemplate}
                      onChange={(e) => setWhatsappTemplate(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    >
                      <option value="standard_overdue">Standard Overdue Reminder (Attach PDF)</option>
                      <option value="friendly_warning">Gentle Reminder (7 days before due date)</option>
                      <option value="strict_demand">Legal Collection demand (90+ Days Overdue)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Notifications */}
            {activeTab === "Notifications" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-text-primary uppercase tracking-widest border-b border-border/50 pb-4">
                  Notification Settings
                </h3>
                
                <div className="space-y-4">
                  {[
                    { title: "Low Stock Alerts", desc: "Get notified when items drop below safety buffer threshold" },
                    { title: "Payment Overdue Warnings", desc: "Daily digest of invoices past their due date" },
                    { title: "System Maintenance & Updates", desc: "Alerts about operational server maintenance and new features" },
                    { title: "New Purchase Orders", desc: "Instant notification for newly registered client purchase orders" }
                  ].map((setting, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-background/30 rounded-xl border border-border">
                      <div>
                        <p className="text-sm font-bold text-text-primary uppercase tracking-wider">{setting.title}</p>
                        <p className="text-xs text-text-muted">{setting.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={i < 2} onChange={() => showToast("Notification settings updated.")} className="sr-only peer" />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Security & Audits */}
            {activeTab === "Security & Audits" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-text-primary uppercase tracking-widest border-b border-border/50 pb-4">
                  Security, Audits & Access Logs
                </h3>
                
                <form onSubmit={(e) => { e.preventDefault(); showToast("Password updated successfully."); }} className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Current Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">New Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Confirm New Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button type="submit" className="bg-transparent border border-accent text-accent hover:bg-accent hover:text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all w-full">
                      Update Password
                    </button>
                  </div>
                </form>

                <div className="space-y-4 pt-6 border-t border-border/30">
                  <div className="flex items-center justify-between p-4 bg-background/30 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-bold text-text-primary uppercase tracking-wider">Multi-Factor Authentication (MFA)</p>
                      <p className="text-xs text-text-muted">Require an authenticator app TOTP code on login</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={twoFactor} 
                        onChange={(e) => setTwoFactor(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background/30 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-bold text-text-primary uppercase tracking-wider">Automatic Session Timeout</p>
                      <p className="text-xs text-text-muted">Log users out automatically after a set period of inactivity</p>
                    </div>
                    <select 
                      value={sessionTimeout} 
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-bold focus:outline-none"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="240">4 Hours</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#3D7A6B] text-white px-6 py-3 rounded-xl shadow-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 animate-in slide-in-from-bottom-8 fade-in z-50">
          <Check className="w-4 h-4" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
