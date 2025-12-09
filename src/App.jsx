import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, ChevronDown, ChevronUp, ShieldCheck, MapPin, Clock,
    FlaskConical, Syringe, Info, BarChart3, X, Filter, Globe,
    FileText, Upload, User, LogIn, Plus, Trash2, CheckSquare, Square,
    ArrowRightLeft, Save, AlertCircle, Lock
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
    getAuth, signInAnonymously, onAuthStateChanged, signOut,
    signInWithCustomToken
} from 'firebase/auth';
import {
    getFirestore, collection, addDoc, query, where, onSnapshot,
    doc, updateDoc, deleteDoc, setDoc, getDoc, serverTimestamp, increment
} from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
// REPLACE THIS OBJECT WITH YOUR OWN KEYS FROM FIREBASE CONSOLE
const firebaseConfig = typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : {
        // Paste your keys here if running locally
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT.firebasestorage.app",
        messagingSenderId: "SENDER_ID",
        appId: "APP_ID"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- JAIPUR DATA ---
const INITIAL_LABS = [
    {
        testName: "Complete Blood Count (CBC)",
        brand: "Dr. B. Lal Clinical Laboratory",
        price: 300,
        parameters: 24,
        sampleType: "Blood (EDTA)",
        collection: "Home Collection & Centers",
        prerequisites: "No fasting required",
        trusted: true,
        reportTime: "6-8 Hours",
        description: "Jaipur's most trusted local diagnostic chain. High precision automated hematology.",
        location: "Malviya Nagar, Vaishali, Raja Park",
        website: "https://www.blallab.com/",
        method: "Automated (Sysmex)"
    },
    {
        testName: "Complete Blood Count (CBC)",
        brand: "Suryam Diagnostic Center",
        price: 250,
        parameters: 22,
        sampleType: "Blood",
        collection: "Lab Visit Only",
        prerequisites: "No fasting",
        trusted: true,
        reportTime: "4 Hours",
        description: "Affordable and quick reports for routine blood work.",
        location: "Tonk Road, Jaipur",
        website: "https://www.google.com/search?q=Suryam+Diagnostic+Jaipur",
        method: "Automated"
    },
    {
        testName: "Complete Blood Count (CBC)",
        brand: "Dr. Lal PathLabs",
        price: 350,
        parameters: 26,
        sampleType: "Blood",
        collection: "Home Collection",
        prerequisites: "No fasting",
        trusted: true,
        reportTime: "12 Hours",
        description: "National standard quality. Samples often processed at central Jaipur hub.",
        location: "C-Scheme, Mansarovar, Jaipur",
        website: "https://www.lalpathlabs.com/",
        method: "Flow Cytometry"
    },
    {
        testName: "Thyroid Profile (Total)",
        brand: "Dr. B. Lal Clinical Laboratory",
        price: 550,
        parameters: 3,
        sampleType: "Serum",
        collection: "Home Collection",
        prerequisites: "Fasting preferred",
        trusted: true,
        reportTime: "Same Day",
        description: "T3, T4, TSH using high-end immunology analyzers.",
        location: "All Jaipur Centers",
        website: "https://www.blallab.com/",
        method: "CLIA"
    },
    {
        testName: "Vitamin D (25-OH)",
        brand: "Orange Health",
        price: 899,
        parameters: 1,
        sampleType: "Serum",
        collection: "Home Collection (60 mins)",
        prerequisites: "No fasting",
        trusted: true,
        reportTime: "6 Hours",
        description: "Fastest Vitamin D report in Jaipur.",
        location: "Vaishali Nagar, C-Scheme",
        website: "https://www.orangehealth.in/",
        method: "CLIA"
    },
    {
        testName: "Full Body Checkup",
        brand: "Dr. B. Lal Clinical Laboratory",
        price: 1999,
        parameters: 60,
        sampleType: "Blood & Urine",
        collection: "Home Collection",
        prerequisites: "12 Hours Fasting",
        trusted: true,
        reportTime: "24 Hours",
        description: "The 'Aarogyam' equivalent for Jaipur. Covers LFT, KFT, Lipid, Sugar, CBC.",
        location: "Jaipur",
        website: "https://www.blallab.com/",
        method: "Comprehensive"
    }
];

const AVAILABLE_TEST_NAMES = [
    "Complete Blood Count (CBC)",
    "Thyroid Profile (Total)",
    "Lipid Profile",
    "Liver Function Test (LFT)",
    "Kidney Function Test (KFT)",
    "HbA1c",
    "Vitamin D (25-OH)",
    "Full Body Checkup"
];

// --- COMPONENTS ---

const TrustedBadge = () => (
    <div className="flex items-center text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold border border-green-200 w-fit">
        <ShieldCheck className="w-3 h-3 mr-1" />
        Trusted
    </div>
);

// --- MODALS ---

const ComparisonModal = ({ labs, onClose }) => {
    if (!labs || labs.length !== 2) return null;
    const [lab1, lab2] = labs;
    if (!lab1 || !lab2) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold flex items-center text-gray-800">
                        <ArrowRightLeft className="mr-2 text-blue-600" /> Compare Labs
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-auto p-6">
                    <div className="grid grid-cols-3 gap-4 min-w-[600px]">
                        <div className="col-span-1 font-semibold text-gray-400 text-sm uppercase py-2">Feature</div>
                        <div className="col-span-1 font-bold text-lg text-blue-700 border-b-2 border-blue-600 pb-2">{lab1.brand}</div>
                        <div className="col-span-1 font-bold text-lg text-purple-700 border-b-2 border-purple-600 pb-2">{lab2.brand}</div>

                        <div className="col-span-1 py-3 border-b text-gray-600 font-medium">Price</div>
                        <div className="col-span-1 py-3 border-b text-lg font-bold">₹{lab1.price}</div>
                        <div className="col-span-1 py-3 border-b text-lg font-bold">₹{lab2.price}</div>

                        <div className="col-span-1 py-3 border-b text-gray-600 font-medium">Trust Status</div>
                        <div className="col-span-1 py-3 border-b">{lab1.trusted ? <TrustedBadge /> : <span className="text-gray-400 text-sm">Standard</span>}</div>
                        <div className="col-span-1 py-3 border-b">{lab2.trusted ? <TrustedBadge /> : <span className="text-gray-400 text-sm">Standard</span>}</div>

                        <div className="col-span-1 py-3 border-b text-gray-600 font-medium">Parameters Covered</div>
                        <div className="col-span-1 py-3 border-b">{lab1.parameters} Tests</div>
                        <div className="col-span-1 py-3 border-b">{lab2.parameters} Tests</div>

                        <div className="col-span-1 py-3 border-b text-gray-600 font-medium">Report Time</div>
                        <div className="col-span-1 py-3 border-b">{lab1.reportTime}</div>
                        <div className="col-span-1 py-3 border-b">{lab2.reportTime}</div>

                        <div className="col-span-1 py-3 border-b text-gray-600 font-medium">Sample Type</div>
                        <div className="col-span-1 py-3 border-b">{lab1.sampleType}</div>
                        <div className="col-span-1 py-3 border-b">{lab2.sampleType}</div>

                        <div className="col-span-1 py-6 text-gray-600 font-medium"></div>
                        <div className="col-span-1 py-6">
                            <button
                                onClick={() => window.open(lab1.website, '_blank')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium"
                            >
                                Visit Website
                            </button>
                        </div>
                        <div className="col-span-1 py-6">
                            <button
                                onClick={() => window.open(lab2.website, '_blank')}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium"
                            >
                                Visit Website
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const PrescriptionModal = ({ isOpen, onClose, user, onLogin }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [prescriptions, setPrescriptions] = useState([]);
    const [view, setView] = useState('upload');

    useEffect(() => {
        if (!isOpen || !user) return;
        const q = query(
            collection(db, 'artifacts', appId, 'users', user.uid, 'prescriptions'),
        );
        const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPrescriptions(items);
        });
        return () => unsub();
    }, [isOpen, user]);

    const handleUpload = async () => {
        if (!file || !user) return;
        setUploading(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'prescriptions'), {
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                status: 'Processing',
                fileSize: (file.size / 1024).toFixed(2) + ' KB'
            });
            setFile(null);
            setView('list');
        } catch (e) {
            console.error(e);
        }
        setUploading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden min-h-[400px] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-blue-50">
                    <h3 className="text-lg font-bold flex items-center text-gray-800">
                        <FileText className="mr-2 text-blue-600" />
                        {user ? 'Your Prescriptions' : 'Sign In Required'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                    {!user ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-2">Login to Upload</h4>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                    We need to save your prescription securely. Please sign in to continue.
                                </p>
                            </div>
                            <button
                                onClick={onLogin}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold flex items-center transition-all hover:scale-105 shadow-lg"
                            >
                                <LogIn className="w-5 h-5 mr-2" />
                                Sign In / Sign Up
                            </button>
                            <p className="text-xs text-gray-400 mt-4">No password required for this demo.</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setView('upload')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'upload' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Upload New
                                </button>
                                <button
                                    onClick={() => setView('list')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${view === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    History ({prescriptions.length})
                                </button>
                            </div>

                            {view === 'upload' ? (
                                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setFile(e.target.files[0])}
                                    />
                                    {file ? (
                                        <div className="text-center">
                                            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                                            <p className="font-medium text-gray-900">{file.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    ) : (
                                        <div className="text-center p-8">
                                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                            <p className="font-medium text-gray-600">Click to upload prescription</p>
                                            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, PDF supported</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto space-y-3">
                                    {prescriptions.length === 0 ? (
                                        <p className="text-center text-gray-400 mt-8">No prescriptions saved yet.</p>
                                    ) : (
                                        prescriptions.map(p => (
                                            <div key={p.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <div className="bg-white p-2 rounded shadow-sm mr-3">
                                                        <FileText className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-800 truncate max-w-[150px]">{p.fileName}</p>
                                                        <p className="text-xs text-gray-500">{new Date(p.uploadedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                                    {p.status}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {view === 'upload' && (
                                <button
                                    disabled={!file || uploading}
                                    onClick={handleUpload}
                                    className={`mt-4 w-full py-3 rounded-xl font-semibold shadow-sm transition-all ${!file ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                    {uploading ? 'Saving...' : 'Submit Prescription'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

export default function App() {
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTest, setSelectedTest] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [showAdmin, setShowAdmin] = useState(false);
    const [showPrescription, setShowPrescription] = useState(false);

    const [labs, setLabs] = useState([]);
    const [comparisonList, setComparisonList] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);

    const [stats, setStats] = useState({ dailyUsers: 0, monthlyUsers: 0 });
    const [newLabData, setNewLabData] = useState({
        brand: '', testName: 'Complete Blood Count (CBC)', price: '', location: 'Jaipur', website: '', trusted: false
    });
    const [trustedCriteria, setTrustedCriteria] = useState("We verify NABL accreditation and last 3 years of audit reports.");

    // --- AUTH & INIT ---
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'analytics', 'summary');
                updateDoc(statsRef, {
                    dailyUsers: increment(1),
                    monthlyUsers: increment(1)
                }).catch(async (err) => {
                    await setDoc(statsRef, { dailyUsers: 1, monthlyUsers: 1, cityStats: {} });
                });
            }
        });

        const labsRef = collection(db, 'artifacts', appId, 'public', 'data', 'labs');
        const unsubLabs = onSnapshot(query(labsRef), (snapshot) => {
            const fetchedLabs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Load initial Jaipur data if database is empty
            if (fetchedLabs.length === 0 && !showAdmin) {
                setLabs(INITIAL_LABS.map((l, i) => ({ ...l, id: `init-${i}` })));
            } else {
                // Combine initial with fetched (or just replace if you prefer)
                // For this demo we'll use fetched if available, or initial if DB is empty
                setLabs(fetchedLabs.length > 0 ? fetchedLabs : INITIAL_LABS.map((l, i) => ({ ...l, id: `init-${i}` })));
            }
        });

        const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'analytics', 'summary');
        const unsubStats = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) setStats(doc.data());
        });

        return () => {
            unsubAuth();
            unsubLabs();
            unsubStats();
        };
    }, []);

    const handleLogin = async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    // --- SECURE ADMIN ACCESS ---
    const handleAdminAccess = () => {
        const pin = prompt("Enter Admin PIN:");
        if (pin === "1234") {
            setShowAdmin(true);
        } else {
            alert("Incorrect PIN");
        }
    };

    const toggleCompare = (lab) => {
        if (comparisonList.find(l => l.id === lab.id)) {
            setComparisonList(comparisonList.filter(l => l.id !== lab.id));
        } else {
            if (comparisonList.length < 2) {
                setComparisonList([...comparisonList, lab]);
            } else {
                setComparisonList([comparisonList[1], lab]);
            }
        }
    };

    const handleAddLab = async () => {
        if (!newLabData.brand || !newLabData.price) return;
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'labs'), {
                ...newLabData,
                price: Number(newLabData.price),
                parameters: Math.floor(Math.random() * 20) + 5,
                createdAt: serverTimestamp(),
                description: "Added by Admin",
                sampleType: "Blood",
                reportTime: "24 Hours",
                collection: "Home"
            });
            setNewLabData({ brand: '', testName: 'Complete Blood Count (CBC)', price: '', location: 'Jaipur', website: '', trusted: false });
        } catch (e) {
            alert("Error adding lab");
        }
    };

    const toggleLabTrust = async (lab) => {
        if (String(lab.id).startsWith('init-')) {
            alert("Cannot edit mock data. Add a new lab to test admin features.");
            return;
        }
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'labs', lab.id), {
                trusted: !lab.trusted
            });
        } catch (e) { console.error(e); }
    };

    const deleteLab = async (id) => {
        if (String(id).startsWith('init-')) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'labs', id));
        } catch (e) { console.error(e); }
    };

    // --- FILTERS ---
    const filteredSuggestions = useMemo(() => {
        if (!searchTerm) return [];
        return AVAILABLE_TEST_NAMES.filter(test => test.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    const filteredLabs = useMemo(() => {
        let result = labs;
        if (selectedTest) {
            result = result.filter(lab => lab.testName === selectedTest);
        }
        return result;
    }, [selectedTest, labs]);


    // --- ADMIN VIEW ---
    if (showAdmin) {
        return (
            <div className="min-h-screen bg-gray-100 font-sans">
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
                    <div className="flex items-center space-x-2">
                        <ShieldCheck className="text-green-400" />
                        <h1 className="text-xl font-bold">Admin Portal</h1>
                        <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">Protected Mode</span>
                    </div>
                    <button onClick={() => setShowAdmin(false)} className="text-sm bg-slate-700 px-3 py-1 rounded hover:bg-slate-600">Exit Admin</button>
                </div>

                <div className="max-w-6xl mx-auto p-6 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h3 className="text-gray-500 text-sm font-semibold uppercase">Daily Users</h3>
                            <p className="text-3xl font-bold text-gray-800">{stats.dailyUsers || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h3 className="text-gray-500 text-sm font-semibold uppercase">Monthly Users</h3>
                            <p className="text-3xl font-bold text-gray-800">{stats.monthlyUsers || 0}</p>
                        </div>
                    </div>

                    {/* Trusted Criteria Editor */}
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Info className="w-4 h-4 mr-2" /> Trusted Batch Criteria</h3>
                        <textarea
                            className="w-full border rounded-lg p-3 text-sm"
                            rows={2}
                            value={trustedCriteria}
                            onChange={(e) => setTrustedCriteria(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"><Save className="w-4 h-4 mr-1 inline" /> Save Criteria</button>
                        </div>
                    </div>

                    {/* Add Lab Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Plus className="w-4 h-4 mr-2" /> Add Manual Lab Entry</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <input placeholder="Brand Name" className="border p-2 rounded" value={newLabData.brand} onChange={e => setNewLabData({ ...newLabData, brand: e.target.value })} />
                            <select className="border p-2 rounded" value={newLabData.testName} onChange={e => setNewLabData({ ...newLabData, testName: e.target.value })}>
                                {AVAILABLE_TEST_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input placeholder="Price (₹)" type="number" className="border p-2 rounded" value={newLabData.price} onChange={e => setNewLabData({ ...newLabData, price: e.target.value })} />
                            <input placeholder="Location (City)" className="border p-2 rounded" value={newLabData.location} onChange={e => setNewLabData({ ...newLabData, location: e.target.value })} />
                            <input placeholder="Website URL" className="border p-2 rounded" value={newLabData.website} onChange={e => setNewLabData({ ...newLabData, website: e.target.value })} />
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="trusted" checked={newLabData.trusted} onChange={e => setNewLabData({ ...newLabData, trusted: e.target.checked })} />
                                <label htmlFor="trusted">Trusted Lab</label>
                            </div>
                        </div>
                        <button onClick={handleAddLab} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 w-full md:w-auto">Add Lab to Database</button>
                    </div>

                    {/* Lab List */}
                    <div className="bg-white p-6 rounded-xl shadow-sm overflow-hidden">
                        <h3 className="font-bold text-gray-800 mb-4">Manage Listed Labs</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
                                    <tr>
                                        <th className="p-3">Brand</th>
                                        <th className="p-3">Test</th>
                                        <th className="p-3">Price</th>
                                        <th className="p-3">Trust Status</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {labs.map(lab => (
                                        <tr key={lab.id} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium">{lab.brand}</td>
                                            <td className="p-3">{lab.testName}</td>
                                            <td className="p-3">₹{lab.price}</td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => toggleLabTrust(lab)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${lab.trusted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    {lab.trusted ? 'Trusted' : 'Standard'}
                                                </button>
                                            </td>
                                            <td className="p-3">
                                                <button onClick={() => deleteLab(lab.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- USER VIEW ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 relative pb-16">

            {/* HEADER / NAV */}
            <nav className="bg-white border-b sticky top-0 z-40 px-4 py-3 shadow-sm">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    {/* Left: Logo & Compare */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => { setSearchTerm(''); setSelectedTest(null); }}>
                            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                                <FlaskConical className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-gray-900 tracking-tight hidden md:block">LabDiscover</span>
                        </div>

                        {/* Compare Toggle */}
                        <div className="hidden md:flex items-center space-x-2 ml-4 pl-4 border-l">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Compare Mode</span>
                            <div className="flex items-center space-x-2">
                                {comparisonList.length > 0 && (
                                    <button
                                        onClick={() => setShowCompareModal(true)}
                                        disabled={comparisonList.length < 2}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${comparisonList.length === 2 ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-gray-100 text-gray-400'}`}
                                    >
                                        Compare ({comparisonList.length}/2)
                                    </button>
                                )}
                                {comparisonList.length > 0 && (
                                    <button onClick={() => setComparisonList([])} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Location & Prescription */}
                    <div className="flex items-center space-x-3">
                        {/* Static Location Badge */}
                        <div className="hidden sm:flex items-center space-x-1 text-sm font-medium text-blue-800 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>Jaipur, RJ</span>
                        </div>

                        {/* Upload Prescription */}
                        <button
                            onClick={() => setShowPrescription(true)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Upload Rx</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <div className={`bg-white pb-12 pt-8 px-4 shadow-sm relative z-20 ${selectedTest ? 'hidden' : 'block'}`}>
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        Compare Lab Tests & Prices
                    </h2>
                    <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                        Discover trusted labs in <span className="text-blue-600 font-bold">Jaipur</span>. Transparent pricing, no hidden fees.
                    </p>

                    {/* SEARCH CONTAINER */}
                    <div className="relative max-w-xl mx-auto">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-11 pr-10 py-4 border-2 border-gray-100 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-lg shadow-blue-900/5 text-lg"
                                placeholder="Search test (e.g. CBC, Thyroid)..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); if (e.target.value === '') setSelectedTest(null); }}
                                onFocus={() => setIsDropdownOpen(true)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => { setSearchTerm(''); setSelectedTest(null); }}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {/* DROPDOWN RECOMMENDATION */}
                        {isDropdownOpen && filteredSuggestions.length > 0 && (
                            <div className="absolute z-50 mt-2 w-full bg-white shadow-xl max-h-60 rounded-xl py-2 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none animate-in fade-in zoom-in-95 duration-200">
                                {filteredSuggestions.map((test, index) => (
                                    <div
                                        key={index}
                                        className="cursor-pointer select-none relative py-3 pl-4 pr-9 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0"
                                        onClick={() => {
                                            setSearchTerm(test);
                                            setSelectedTest(test);
                                            setIsDropdownOpen(false);
                                            setExpandedCardId(null);
                                        }}
                                    >
                                        <div className="flex items-center">
                                            <span className="font-medium block truncate text-gray-700">
                                                {test}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- RESULTS SECTION --- */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {selectedTest ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    Available Labs for <span className="text-blue-600">{selectedTest}</span>
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Showing results in Jaipur</p>
                            </div>

                            {/* Comparison Banner (Mobile/Inline) */}
                            {comparisonList.length > 0 && (
                                <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg flex items-center justify-between">
                                    <span className="text-sm font-semibold text-blue-800 mr-3">Comparing {comparisonList.length}/2</span>
                                    {comparisonList.length === 2 && (
                                        <button onClick={() => setShowCompareModal(true)} className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded shadow hover:bg-blue-700">View</button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {filteredLabs.length > 0 ? (
                                filteredLabs.map((lab) => (
                                    <div
                                        key={lab.id}
                                        className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden hover:shadow-md ${expandedCardId === lab.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
                                    >
                                        <div className="p-5">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 cursor-pointer" onClick={() => setExpandedCardId(expandedCardId === lab.id ? null : lab.id)}>
                                                    <h3 className="text-lg font-bold text-gray-900">{lab.brand}</h3>
                                                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                                                        <MapPin className="w-3 h-3 mr-1" /> {lab.location}
                                                    </p>
                                                </div>
                                                <div className="text-right pl-4">
                                                    <span className="block text-xl font-bold text-blue-600">₹{lab.price}</span>
                                                    {lab.trusted && <div className="mt-2 flex justify-end"><TrustedBadge /></div>}

                                                    {/* Compare Checkbox */}
                                                    <div className="mt-3 flex items-center justify-end cursor-pointer" onClick={() => toggleCompare(lab)}>
                                                        <span className="text-xs text-gray-400 mr-2 uppercase font-semibold">Compare</span>
                                                        {comparisonList.find(l => l.id === lab.id) ? (
                                                            <CheckSquare className="w-5 h-5 text-blue-600" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-gray-300 hover:text-blue-400" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Stats Grid */}
                                            <div
                                                className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-gray-700 cursor-pointer"
                                                onClick={() => setExpandedCardId(expandedCardId === lab.id ? null : lab.id)}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 uppercase font-semibold">Parameters</span>
                                                    <span className="font-medium">{lab.parameters} Tests</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 uppercase font-semibold">Sample</span>
                                                    <span className="font-medium">{lab.sampleType}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 uppercase font-semibold">Collection</span>
                                                    <span className="font-medium">{lab.collection}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 uppercase font-semibold">Pre-requisites</span>
                                                    <span className="font-medium text-orange-600">{lab.prerequisites}</span>
                                                </div>
                                            </div>

                                            {/* View Details Text (Only if not expanded) */}
                                            {!expandedCardId && (
                                                <div className="flex justify-center mt-2" onClick={() => setExpandedCardId(lab.id)}>
                                                    <ChevronDown className="w-5 h-5 text-gray-300 hover:text-blue-500 transition-colors" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedCardId === lab.id && (
                                            <div className="bg-blue-50/50 p-5 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                                            <Info className="w-4 h-4 mr-2 text-blue-600" /> Test Description
                                                        </h4>
                                                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                                            {lab.description}
                                                        </p>
                                                        {lab.trusted && (
                                                            <div className="bg-green-50 border border-green-100 p-3 rounded-lg text-xs text-green-800">
                                                                <span className="font-bold flex items-center mb-1"><ShieldCheck className="w-3 h-3 mr-1" /> Trusted Lab</span>
                                                                {trustedCriteria}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between text-sm border-b border-gray-200 pb-2">
                                                            <span className="text-gray-500 flex items-center"><Clock className="w-4 h-4 mr-2" /> Report Time</span>
                                                            <span className="font-medium text-gray-900">{lab.reportTime}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm border-b border-gray-200 pb-2">
                                                            <span className="text-gray-500 flex items-center"><FlaskConical className="w-4 h-4 mr-2" /> Method</span>
                                                            <span className="font-medium text-gray-900">{lab.method || 'Automated'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                                                    <button
                                                        onClick={() => {
                                                            if (lab.website && lab.website.startsWith('http')) {
                                                                window.open(lab.website, '_blank');
                                                            } else {
                                                                alert("Website not available for this lab.");
                                                            }
                                                        }}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm text-sm flex items-center"
                                                    >
                                                        Visit Website <Globe className="w-4 h-4 ml-2" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                    <p className="text-gray-500">No labs found for <span className="font-semibold">{selectedTest}</span> in Jaipur.</p>
                                    <button onClick={() => setSelectedTest(null)} className="mt-2 text-blue-600 font-medium hover:underline">
                                        Browse all tests
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* INTRO CARDS */
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center opacity-70">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <Globe className="w-8 h-8 mx-auto text-blue-500 mb-3" />
                            <h3 className="font-bold">100% Free Discovery</h3>
                            <p className="text-xs text-gray-500 mt-2">We don't charge any commission. Direct links to lab websites.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <ShieldCheck className="w-8 h-8 mx-auto text-green-500 mb-3" />
                            <h3 className="font-bold">Verified Trust Score</h3>
                            <p className="text-xs text-gray-500 mt-2">We vet labs based on NABL and CAP accreditation.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <ArrowRightLeft className="w-8 h-8 mx-auto text-purple-500 mb-3" />
                            <h3 className="font-bold">Smart Comparison</h3>
                            <p className="text-xs text-gray-500 mt-2">Compare prices and specs side-by-side instantly.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* --- FOOTER / ADMIN TRIGGER --- */}
            <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <p className="text-xs text-gray-400">© 2024 LabDiscover Jaipur.</p>
                <button
                    onClick={handleAdminAccess}
                    className="text-xs font-semibold text-gray-400 hover:text-blue-600 transition-colors flex items-center"
                >
                    <Lock className="w-3 h-3 mr-1" /> Admin
                </button>
            </div>

            {/* MODALS */}
            <ComparisonModal labs={comparisonList} onClose={() => setShowCompareModal(false)} />
            <PrescriptionModal
                isOpen={showPrescription}
                onClose={() => setShowPrescription(false)}
                user={user}
                onLogin={handleLogin}
            />

        </div>
    );
}