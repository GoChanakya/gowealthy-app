import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../../src/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { BACKEND_URL, NSE_SERVICE_URL, EMAIL_SERVICE_URL } from '../../../../src/config/services';// const NSE_SERVICE_URL = 'http://172.20.10.2:3000'; // ← your IP

// ─── NSE lookup tables ────────────────────────────────────────────────────────
// occ_code '44' + occ_type 'O' is the only confirmed working combination in NSE UAT
// (directly from NSE sample doc page 96). ucc_code is the text value for CLIENTCOMMON183.
// When NSE provides the full occupation master sheet, update fatca_code per entry.
const OCCUPATIONS = [
  { label: 'Business',      value: 'BUSINESS',      fatca_code: '44', occ_type: 'O', ucc_code: 'BUSINESS' },
  { label: 'Service',       value: 'SERVICE',       fatca_code: '44', occ_type: 'O', ucc_code: 'SERVICE' },
  { label: 'Professional',  value: 'PROFESSIONAL',  fatca_code: '44', occ_type: 'O', ucc_code: 'PROFESSIONAL' },
  { label: 'Agriculture',   value: 'AGRICULTURIST', fatca_code: '44', occ_type: 'O', ucc_code: 'AGRICULTURIST' },
  { label: 'Retired',       value: 'RETIRED',       fatca_code: '44', occ_type: 'O', ucc_code: 'RETIRED' },
  { label: 'Housewife',     value: 'HOUSEWIFE',     fatca_code: '44', occ_type: 'O', ucc_code: 'HOUSEWIFE' },
  { label: 'Student',       value: 'STUDENT',       fatca_code: '44', occ_type: 'O', ucc_code: 'STUDENT' },
  { label: 'Others',        value: 'OTHERS',        fatca_code: '44', occ_type: 'O', ucc_code: 'OTHERS' },
];

const INCOME_SLABS = [
  { label: 'Below ₹1 Lakh',         value: '31' },
  { label: '₹1 – 5 Lakhs',         value: '32' },
  { label: '₹5 – 10 Lakhs',        value: '33' },
  { label: '₹10 – 25 Lakhs',       value: '34' },
  { label: '₹25 Lakhs – 1 Crore',  value: '35' },
  { label: 'Above ₹1 Crore',       value: '36' },
];

const WEALTH_SOURCES = [
  { label: 'Salary',               value: '01' },
  { label: 'Business Income',      value: '02' },
  { label: 'Gift',                 value: '03' },
  { label: 'Ancestral Property',   value: '04' },
  { label: 'Rental Income',        value: '05' },
  { label: 'Prize Money',          value: '06' },
  { label: 'Royalty',              value: '07' },
  { label: 'Others',               value: '08' },
];

const STATES = [
  { label: 'Andhra Pradesh',       value: 'AP' },
  { label: 'Arunachal Pradesh',    value: 'AR' },
  { label: 'Assam',                value: 'AS' },
  { label: 'Bihar',                value: 'BR' },
  { label: 'Chhattisgarh',         value: 'CG' },
  { label: 'Goa',                  value: 'GA' },
  { label: 'Gujarat',              value: 'GJ' },
  { label: 'Haryana',              value: 'HR' },
  { label: 'Himachal Pradesh',     value: 'HP' },
  { label: 'Jharkhand',            value: 'JH' },
  { label: 'Karnataka',            value: 'KA' },
  { label: 'Kerala',               value: 'KL' },
  { label: 'Madhya Pradesh',       value: 'MP' },
  { label: 'Maharashtra',          value: 'MH' },
  { label: 'Manipur',              value: 'MN' },
  { label: 'Meghalaya',            value: 'ML' },
  { label: 'Mizoram',              value: 'MZ' },
  { label: 'Nagaland',             value: 'NL' },
  { label: 'Odisha',               value: 'OR' },
  { label: 'Punjab',               value: 'PB' },
  { label: 'Rajasthan',            value: 'RJ' },
  { label: 'Sikkim',               value: 'SK' },
  { label: 'Tamil Nadu',           value: 'TN' },
  { label: 'Telangana',            value: 'TS' },
  { label: 'Tripura',              value: 'TR' },
  { label: 'Uttar Pradesh',        value: 'UP' },
  { label: 'Uttarakhand',          value: 'UK' },
  { label: 'West Bengal',          value: 'WB' },
  { label: 'Delhi',                value: 'DL' },
  { label: 'Jammu & Kashmir',      value: 'JK' },
  { label: 'Ladakh',               value: 'LA' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Split full name → first + last for NSE
const splitName = (fullName = '') => {
  const parts = fullName.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return {
    first: parts.slice(0, -1).join(' '),
    last:  parts[parts.length - 1],
  };
};

// ─── Component ────────────────────────────────────────────────────────────────
const Screen6FATCAAndUCC = () => {
  const router = useRouter();

  // User input fields
  const [gender, setGender]         = useState('M');
  const [occupation, setOccupation] = useState('');
  const [incomeSlab, setIncomeSlab] = useState('');
  const [wealthSource, setWealthSource] = useState('');
  const [birthCity, setBirthCity]   = useState('');
  const [city, setCity]             = useState('');
  const [state, setState]           = useState('');
  const [pincode, setPincode]       = useState('');

  // UI state
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitStep, setSubmitStep]       = useState(''); // progress label
  const [authLink, setAuthLink]           = useState(null); // final NSE auth link
  const [showAuthModal, setShowAuthModal]   = useState(false); // auth link modal
  const [error, setError]                 = useState('');

  // ── On mount: load Aadhaar address to pre-fill city/pincode
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      setIsLoadingData(true);
      const phone = await AsyncStorage.getItem('user_phone');
      if (!phone) return;

      const docSnap = await getDoc(doc(db, 'mf_onboarding', phone));
      if (!docSnap.exists()) return;

      const data = docSnap.data();

      // Restore if already partially filled
      if (data?.fatca_data) {
        const f = data.fatca_data;
        if (f.gender)       setGender(f.gender);
        if (f.occupation)   setOccupation(f.occupation);
        if (f.inc_slab)     setIncomeSlab(f.inc_slab);
        if (f.srce_wealt)   setWealthSource(f.srce_wealt);
        if (f.po_bir_inc)   setBirthCity(f.po_bir_inc);
        if (f.city)         setCity(f.city);
        if (f.state)        setState(f.state);
        if (f.pincode)      setPincode(f.pincode);
      }

      // Pre-fill address fields from Aadhaar if not yet set
      const address = data?.aadhaar_data?.address || '';
      if (address && !city) {
        // Try to extract pincode (6-digit number at end)
        const pincodeMatch = address.match(/\b(\d{6})\b/);
        if (pincodeMatch) setPincode(pincodeMatch[1]);
        console.log('📍 Aadhaar address:', address);
      }

      // If auth link already generated in previous session
      if (data?.ucc_auth_link) setAuthLink(data.ucc_auth_link);

    } catch (e) {
      console.log('Screen 6 load error:', e.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  // ── UAT auto-fill ─────────────────────────────────────────────────────────
  // Keeps: real email (from Screen 4), real name/DOB from OCR
  // Overrides: PAN (UAT only accepts test PANs) + bank (dummy for demo)
  const fillUATValues = async () => {
    try {
      const phone = await AsyncStorage.getItem('user_phone');
      if (!phone) { Alert.alert('Error', 'No phone found'); return; }

      // Read current Firestore to preserve real email and name
      const docSnap = await getDoc(doc(db, 'mf_onboarding', phone));
      const existing = docSnap.exists() ? docSnap.data() : {};
      const realEmail   = existing?.email_data?.email   || 'test@test.com';
      const realName    = existing?.pan_data?.name      || 'PRIYANKA TOPIWALA';
      const realDob     = existing?.pan_data?.dob       || '04/11/1994';
      const realFather  = existing?.pan_data?.father_name || '';

      // Update UI state
      setGender('M');
      setOccupation('BUSINESS');
      setIncomeSlab('31');
      setWealthSource('08');
      setBirthCity('Kanbhai');
      setCity('MUMBAI');
      setState('AP');
      setPincode('401201');

      // Write to Firestore — only override PAN + bank, keep real email + name
      await updateDoc(doc(db, 'mf_onboarding', phone), {
        pan_data: {
          pan_number:    'BVYPD3824K',    // NSE UAT only accepts test PANs
          name:          realName,         // keep real name from OCR
          father_name:   realFather,
          dob:           realDob,          // keep real DOB from OCR
          pan_image_url: existing?.pan_data?.pan_image_url || '',
        },
        ucc_code: 'HAGO' + String(phone).slice(-4),
        // Keep real aadhaar data — only override address to UAT-safe value
        
        // Keep real email from Screen 4 — NSE auth link goes to this inbox
        // email_data is NOT overridden
        // Bank — dummy values for UAT demo
        bank_data: {
          account_no:   '12311115',
          ifsc_code:    'SBIN0000019',
          account_type: 'SB',
          default_bank: 'Y',
        },
      });

      Alert.alert(
        '✅ UAT Ready',
        `PAN set to test value.\nBank set to dummy values.\nYour real email (${realEmail}) preserved for NSE auth link.`
      );
      console.log('✅ UAT values written — email preserved:', realEmail);
    } catch (e) {
      console.error('❌ UAT fill error:', e.message);
      Alert.alert('Error', 'Failed to set UAT values: ' + e.message);
    }
  };

  const isFormValid =
    gender && occupation && incomeSlab &&
    wealthSource && birthCity.trim() &&
    city.trim() && state && pincode.length === 6;

  // ── Main submit: FATCA → UCC → GET_LINK ──────────────────────────────────
  const handleSubmit = async () => {
    if (!isFormValid) return;
    setError('');

    try {
      setIsSubmitting(true);
      const phone = await AsyncStorage.getItem('user_phone');
      if (!phone) throw new Error('Session expired');

      // Load all Firestore data
      const docSnap = await getDoc(doc(db, 'mf_onboarding', phone));
      if (!docSnap.exists()) throw new Error('Onboarding data not found');
      const data = docSnap.data();

      // Validate required upstream data exists
      if (!data?.pan_data?.pan_number)  throw new Error('PAN data missing. Please complete Screen 1.');
      if (!data?.bank_data?.account_no) throw new Error('Bank data missing. Please complete Screen 5.');
      if (!data?.email_data?.email)     throw new Error('Email missing. Please complete Screen 4.');
      if (!data?.ucc_code)              throw new Error('UCC code missing. Please restart from Screen 1.');

      // ── Assemble values ───────────────────────────────────────────────────
      const panNumber  = data.pan_data.pan_number;
      const fullName   = data.pan_data.name || '';
      const dob        = data.pan_data.dob  || '';        // DD/MM/YYYY
      const { first: firstName, last: lastName } = splitName(fullName);
      // Split Aadhaar address string into 3 lines of max 120/40/40 chars
const fullAddr = data.aadhaar_data?.address || `${city}, ${state}`;
const addrWords = fullAddr.split(',').map(s => s.trim()).filter(Boolean);

// Group into 3 address lines — NSE max 120 chars for address_1
let addr1 = '', addr2 = '', addr3 = '';
let current = '';
const lines = [];
for (const word of addrWords) {
  if ((current + ', ' + word).length > 38) {
    lines.push(current);
    current = word;
  } else {
    current = current ? `${current}, ${word}` : word;
  }
}
if (current) lines.push(current);
addr1 = (lines[0] || '').slice(0, 120).toUpperCase();
addr2 = (lines[1] || '').slice(0, 40).toUpperCase();
addr3 = (lines[2] || '').slice(0, 40).toUpperCase();
      const email      = data.email_data.email;
      const ucc        = data.ucc_code;
      const mobile10   = String(phone).replace(/\D/g, '').slice(-10);
      const occupObj   = OCCUPATIONS.find(o => o.value === occupation);
      const kycType    = data.ekyc_registered ? 'E' : 'K'; // E=eKYC, K=KRA

      // Save fatca form inputs to Firestore
      await updateDoc(doc(db, 'mf_onboarding', phone), {
        fatca_data: { gender, occupation, inc_slab: incomeSlab, srce_wealt: wealthSource, po_bir_inc: birthCity, city, state, pincode },
        onboarding_step: 6,
      });

      // ════════════════════════════════════════════════════════════════════
      // CALL 1 — FATCA Upload  ✅ RE-ENABLED
      // Working values confirmed from UAT testing (occ_code:01, occ_type:B)
      // NOTE: For real investors — co_bir_inc, tax_res1, tpin1 will use
      // actual country codes. For UAT we use NSE's test values.
      // ════════════════════════════════════════════════════════════════════
      setSubmitStep('Uploading FATCA declaration...');
      console.log('📋 [Screen6] Calling FATCA upload...');

      const fatcaPayload = {
        reg_details: [{
          pan_rp:      panNumber,
          inv_name:    fullName,
          dob:         dob,
          fr_name:     data.pan_data.father_name || '',
          sp_name:     '',
          tax_status:  '01',
          data_src:    'P',            // P=Paper, confirmed working in UAT
          addr_type:   '5',            // 5=Unspecified, confirmed working
          po_bir_inc:  birthCity,
          co_bir_inc:  'IN',           // Country of birth — India for real users
          tax_res1:    'IN',           // Tax residency — India for real users
          tpin1:       panNumber,      // PAN = Tax ID for Indian residents
          id1_type:    'C',            // C=PAN card for Indian residents
          tax_res2: '', tpin2: '', id2_type: '',
          tax_res3: '', tpin3: '', id3_type: '',
          tax_res4: '', tpin4: '', id4_type: '',
          srce_wealt:  wealthSource,
          corp_servs:  '01',           // confirmed working in UAT
          inc_slab:    incomeSlab,
          net_worth:   '',
          nw_date:     '',
          pep_flag:    'N',
          occ_code:    '01',           // confirmed working in UAT (occ_code:01 + B)
          occ_type:    'B',            // confirmed working in UAT
          exemp_code:  '',
          ffi_drnfe:   '',
          giin_no:     '',
          spr_entity:  '',
          giin_na:     '',
          giin_exemc:  '',
          nffe_catg:   '',
          act_nfe_sc:  '',
          nature_bus:  '',
          rel_listed:  '',
          exch_name:   'O',
          ubo_appl:    'N',
          ubo_count:   '',
          sdf_flag:    'Y',
          ubo_df:      'N',
          aadhaar_rp:  '',
          new_change:  '',
          log_name:    fullName,
          filler1:     '',
          filler2:     '',
        }],
      };

      const fatcaRes = await fetch(`${NSE_SERVICE_URL}/api/nse/fatca-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fatcaPayload),
      });
      const fatcaData = await fatcaRes.json();
      console.log('📋 FATCA response:', JSON.stringify(fatcaData));

      const fatcaResult = fatcaData?.reg_details?.[0];
      if (!fatcaRes.ok || fatcaResult?.reg_status === 'REG_FAILED') {
        throw new Error(`FATCA failed: ${fatcaResult?.reg_remark || fatcaData?.error || 'Unknown error'}`);
      }
      const fatcaRegId = fatcaResult?.reg_id || '';
      console.log('✅ FATCA success, reg_id:', fatcaRegId);

      // ════════════════════════════════════════════════════════════════════
      // CALL 2 — UCC Registration (183-column)
      // ════════════════════════════════════════════════════════════════════
      setSubmitStep('Registering your investment account...');
      console.log('📋 [Screen6] Calling UCC register...');

      const uccPayload = {
        reg_details: [{
          client_code:                    ucc,
          primary_holder_first_name:      firstName,
          primary_holder_middle_name:     '',
          primary_holder_last_name:       lastName,
          tax_status:                     '01',            // confirmed working — NOT 'INDIVIDUAL'
          gender:                         gender,           // M/F — confirmed working as single char
          primary_holder_dob_incorporation: dob,
          occupation_code:                '02',             // confirmed working in UAT
          holding_nature:                 'SI',             // confirmed working — NOT 'SINGLE'
          second_holder_first_name: '', second_holder_middle_name: '', second_holder_last_name: '',
          third_holder_first_name:  '', third_holder_middle_name:  '', third_holder_last_name:  '',
          second_holder_dob: '', third_holder_dob: '',
          guardian_first_name: '', guardian_middle_name: '', guardian_last_name: '', guardian_dob: '',
          primary_holder_pan_exempt:      'N',
          second_holder_pan_exempt: '', third_holder_pan_exempt: '', guardian_pan_exempt: '',
          primary_holder_pan:             panNumber,
          second_holder_pan: '', third_holder_pan: '', guardian_pan: '',
          primary_holder_exempt_category: '',
          second_holder_exempt_category: '', third_holder_exempt_category: '', guardian_exempt_category: '',
          client_type:                    'P',              // Physical / non-demat
          pms:                            'N',
          default_dp:                     'PHYS',
          cdsl_dpid: '', cdslcltid: '', cmbp_id: '', nsdldpid: '', nsdlcltid: '',
          // Bank — from Firestore bank_data
          account_type_1:                 data.bank_data.account_type,  // SB/CB/NE/NO
          account_no_1:                   data.bank_data.account_no,
          micr_no_1:                      '',
          ifsc_code_1:                    data.bank_data.ifsc_code,
          default_bank_flag_1:            'Y',
          account_type_2: '', account_no_2: '', micr_no_2: '', ifsc_code_2: '', default_bank_flag_2: '',
          account_type_3: '', account_no_3: '', micr_no_3: '', ifsc_code_3: '', default_bank_flag_3: '',
          account_type_4: '', account_no_4: '', micr_no_4: '', ifsc_code_4: '', default_bank_flag_4: '',
          account_type_5: '', account_no_5: '', micr_no_5: '', ifsc_code_5: '', default_bank_flag_5: '',
          cheque_name:                    firstName,
          div_pay_mode:                   '01',             // confirmed working in UAT
          // Address — from Aadhaar + user confirmed fields
          address_1:                      addr1,           // NSE UAT accepts max 120 chars in address_1, 40 in address_2/3
          address_2:                      addr2,
          address_3:                      addr3,
          city:                           city.toUpperCase(),
          state:                          state,            // 2-char code e.g. MH
          pincode:                        pincode,
          country:                        'INDIA',
          resi_phone: '', resi_fax: '', office_phone: '', office_fax: '',
          email:                          email,
          communication_mode:             'E',              // Electronic
          foreign_address_1: '', foreign_address_2: '', foreign_address_3: '',
          foreign_address_city: '', foreign_address_pincode: '',
          foreign_address_state: '', foreign_address_country: '',
          foreign_address_resi_phone: '', foreign_address_fax: '',
          foreign_address_off_phone: '', foreign_address_off_fax: '',
          indian_mobile_no:               mobile10,
          primary_holder_kyc_type:        'C',              // C=CKYC — confirmed working in UAT
          primary_holder_ckyc_number:     '1234567891',     // required when kyc_type=C
          second_holder_kyc_type: '', second_holder_ckyc_number: '',
          third_holder_kyc_type:  '', third_holder_ckyc_number:  '',
          guardian_kyc_type:      '', guardian_ckyc_number:      '',
          primary_holder_kra_exempt_ref_no: '',
          second_holder_kra_exempt_ref_no:  '',
          third_holder_kra_exempt_ref_no:   '',
          guardian_exempt_ref_no:           '',
          aadhaar_updated:                'Y',
          mapin_id:                       '',
          paperless_flag:                 'Z',              // Paperless
          lei_no:                         '',
          lei_validity:                   '',
          mobile_declaration_flag:        'SE',             // confirmed working — NOT 'Self'
          email_declaration_flag:         'SE',             // confirmed working — NOT 'Self'
          second_holder_email: '', second_holder_email_declaration: '',
          second_holder_mobile: '', second_holder_mobile_declaration: '',
          third_holder_email: '', third_holder_email_declaration: '',
          third_holder_mobile: '', third_holder_mobile_declaration: '',
          guardian_relation:              '',
          nomination_opt:                 'N',
          nomination_authentication:      'O',              // O=OTP — confirmed working in UAT
          nominee_1_name: '', nominee_1_relationship: '',
          nominee_1_applicable: ' ', nominee_1_minor_flag: '',
          nominee_1_dob: '', nominee_1_guardian: '', nominee_1_guardian_pan: '',
          nominee_1_identity_type: '', nominee_1_identity_number: '',
          nominee_1_email: '', nominee_1_mobile: '',
          nominee_1_address1: '', nominee_1_address2: '', nominee_1_address3: '',
          nominee_1_city: '', nominee_1_pin: '', nominee_1_country: '',
          nominee_2_name: '', nominee_2_relationship: '',
          nominee_2_applicable: ' ', nominee_2_minor_flag: '',
          nominee_2_dob: '', nominee_2_guardian: '', nominee_2_guardian_pan: '',
          nominee_2_identity_type: '', nominee_2_identity_number: '',
          nominee_2_email: '', nominee_2_mobile: '',
          nominee_2_address1: '', nominee_2_address2: '', nominee_2_address3: '',
          nominee_2_city: '', nominee_2_pin: '', nominee_2_country: '',
          nominee_3_name: '', nominee_3_relationship: '',
          nominee_3_applicable: ' ', nominee_3_minor_flag: '',
          nominee_3_dob: '', nominee_3_guardian: '', nominee_3_guardian_pan: '',
          nominee_3_identity_type: '', nominee_3_identity_number: '',
          nominee_3_email: '', nominee_3_mobile: '',
          nominee_3_address1: '', nominee_3_address2: '', nominee_3_address3: '',
          nominee_3_city: '', nominee_3_pin: '', nominee_3_country: '',
          nominee_soa:                    'N',
          nominee_opt_out_ref_no:         '',
          reg_id: '', reg_status: '', reg_remark: '',
        }],
      };

      const uccRes = await fetch(`${NSE_SERVICE_URL}/api/nse/ucc-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uccPayload),
      });
      const uccData = await uccRes.json();
      console.log('📋 UCC response:', JSON.stringify(uccData));

      const uccResult = uccData?.reg_details?.[0];
      if (!uccRes.ok || uccResult?.reg_status === 'REG_FAILED') {
        throw new Error(`UCC registration failed: ${uccResult?.reg_remark || uccData?.error || 'Unknown error'}`);
      }
      const uccRegId = uccResult?.reg_id || '';
      console.log('✅ UCC success, reg_id:', uccRegId);

      // ════════════════════════════════════════════════════════════════════
      // CALL 3 — GET_LINK for UCC authorization
      // 3s delay because NSE UAT takes a moment to propagate UCC registration.
      // In production this delay is not needed but doesn't hurt.
      // ════════════════════════════════════════════════════════════════════
      setSubmitStep('Almost done, generating authorization link...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // UAT propagation delay

      console.log('📋 [Screen6] Calling GET_LINK, UCC:', ucc);

      const fetchLink = async () => {
        const res = await fetch(`${NSE_SERVICE_URL}/api/nse/get-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productType: 'CL_ACT', productRefId: ucc }),
        });
        return res.json();
      };

      let linkData = await fetchLink();
      console.log('📋 GET_LINK response:', JSON.stringify(linkData));

      // If empty link, retry once after 5 more seconds (UAT timing)
      if (!linkData?.firstHolderLink && linkData?.errorMessage) {
        console.log('⏳ GET_LINK empty, retrying in 5s...');
        setSubmitStep('Waiting for NSE to process... (retry)');
        await new Promise(resolve => setTimeout(resolve, 5000));
        linkData = await fetchLink();
        console.log('📋 GET_LINK retry response:', JSON.stringify(linkData));
      }

      const authUrl = linkData?.firstHolderLink || '';
      console.log('🔗 Auth URL:', authUrl || '(empty after retry)');

      // Save everything to Firestore
      await updateDoc(doc(db, 'mf_onboarding', phone), {
        ucc_registered:  true,
        ucc_reg_id:      uccRegId,
        ucc_auth_link:   authUrl,
        fatca_reg_id:    fatcaRegId,
        onboarding_step: 6,
        completed_at:    new Date().toISOString(),
      });

      setAuthLink(authUrl);
      setSubmitStep('');
      setShowAuthModal(true); // show modal with auth link
      console.log('🎉 Onboarding complete! Auth link:', authUrl);

    } catch (err) {
      console.error('❌ Screen 6 submit error:', err.message);
      setError(err.message);
      setSubmitStep('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAuthLink = async () => {
    if (!authLink) return;
    try {
      await Linking.openURL(authLink);
    } catch {
      Alert.alert('Error', 'Could not open authorization link.');
    }
  };

  // ── Reusable Dropdown ─────────────────────────────────────────────────────
  const Dropdown = ({ label, options, value, onChange }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[styles.chip, value === opt.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, value === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  if (isLoadingData) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#6b50c4" />
        <Text style={styles.loadingText}>Loading your details...</Text>
      </View>
    );
  }

  // ── AUTH LINK MODAL ─────────────────────────────────────────────────────
  const AuthModal = () => (
    <Modal
      visible={showAuthModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAuthModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Handle bar */}
          <View style={styles.modalHandle} />

          <Text style={styles.modalEmoji}>🔐</Text>
          <Text style={styles.modalTitle}>Authorize Your Account</Text>
          <Text style={styles.modalSubtitle}>
            Your mutual fund account is registered with NSE.
            Complete authorization to start investing.
          </Text>

          {/* Steps */}
          <View style={styles.modalSteps}>
            <View style={styles.modalStep}>
              <Text style={styles.modalStepDone}>✅</Text>
              <Text style={styles.modalStepText}>FATCA declaration submitted</Text>
            </View>
            <View style={styles.modalStep}>
              <Text style={styles.modalStepDone}>✅</Text>
              <Text style={styles.modalStepText}>UCC account registered</Text>
            </View>
            <View style={styles.modalStep}>
              <Text style={styles.modalStepPending}>⏳</Text>
              <Text style={styles.modalStepText}>Authorization pending</Text>
            </View>
          </View>

          {/* Open link button */}
          {authLink ? (
            <TouchableOpacity onPress={handleOpenAuthLink} style={styles.modalAuthBtn}>
              <Text style={styles.modalAuthBtnText}>🔗 Open NSE Authorization Page →</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.modalNoLink}>
              <Text style={styles.modalNoLinkText}>
                ⚠️ Link not yet available.NSE usually sends it to your registered email within a few minutes.
              </Text>
            </View>
          )}

          <Text style={styles.modalNote}>
            After authorizing on NSE's page, come back and tap Done.
          </Text>

          {/* Done button */}
  <TouchableOpacity
  onPress={async () => {
    try {
      const phone = await AsyncStorage.getItem('user_phone');
      const docSnap = await getDoc(doc(db, 'mf_onboarding', phone));
      const ucc = docSnap.data()?.ucc_code;

      const res = await fetch(`${NSE_SERVICE_URL}/api/nse/client-auth-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_code: ucc }),
      });
      const data = await res.json();
      console.log('📋 Auth status response:', JSON.stringify(data));

      const report    = data?.report_data?.[0];
      const authStatus = report?.auth_status || report?.first_holder_auth_status;

      if (authStatus === 'SUCCESS') {
        await updateDoc(doc(db, 'mf_onboarding', phone), {
          ucc_authorized:      true,
          ucc_authorized_at:   new Date().toISOString(),
          onboarding_complete: true,
        });
        setShowAuthModal(false);
        router.replace('/(gowealthy)/mf/onboarding/preview'); // your trading screen route
      } else {
        Alert.alert(
          'Not Yet Authorized',
          `Status: ${authStatus || 'PENDING'}\n\nPlease complete authorization on NSE's page first, then tap Done again.`
        );
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }}
  style={styles.modalDoneBtn}
>
  <Text style={styles.modalDoneBtnText}>✅ Done — I've Authorized</Text>
</TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity
            onPress={() => setShowAuthModal(false)}
            style={styles.modalDismissBtn}
          >
            <Text style={styles.modalDismissBtnText}>Remind me later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
    <AuthModal />
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5, 6].map((step, idx) => (
          <View key={step} style={styles.progressStepContainer}>
            <View style={[
              styles.progressCircle,
              step <= 5 && styles.progressCircleCompleted,
              step === 6 && styles.progressCircleActive,
            ]}>
              <Text style={[styles.progressText, step <= 6 && styles.progressTextActive]}>
                {step <= 5 ? '✓' : step}
              </Text>
            </View>
            {idx < 5 && <View style={styles.progressLine} />}
          </View>
        ))}
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionTitle}>Complete Your Profile</Text>
        <Text style={styles.questionSubtitle}>
          Last step — a few details required for regulatory compliance
        </Text>
      </View>

      {/* UAT Auto-fill button — updates both UI + Firestore */}
      <TouchableOpacity onPress={fillUATValues} style={styles.uatFillBtn}>
        <Text style={styles.uatFillBtnText}>🧪 Auto-fill UAT Values (Updates DB)</Text>
        <Text style={styles.uatFillSubText}>Tap → confirm alert → then submit</Text>
      </TouchableOpacity>

      <View style={styles.formContainer}>

        {/* Gender */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Gender *</Text>
          <View style={styles.genderRow}>
            {[{ label: 'Male', value: 'M' }, { label: 'Female', value: 'F' }, { label: 'Other', value: 'O' }].map(g => (
              <TouchableOpacity
                key={g.value}
                onPress={() => setGender(g.value)}
                style={[styles.genderBtn, gender === g.value && styles.genderBtnActive]}
              >
                <Text style={[styles.genderBtnText, gender === g.value && styles.genderBtnTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Dropdown
          label="Occupation *"
          options={OCCUPATIONS}
          value={occupation}
          onChange={setOccupation}
        />

        <Dropdown
          label="Annual Income Range *"
          options={INCOME_SLABS}
          value={incomeSlab}
          onChange={setIncomeSlab}
        />

        <Dropdown
          label="Source of Wealth *"
          options={WEALTH_SOURCES}
          value={wealthSource}
          onChange={setWealthSource}
        />

        {/* City of Birth */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>City of Birth *</Text>
          <TextInput
            value={birthCity}
            onChangeText={setBirthCity}
            placeholder="e.g. Mumbai"
            placeholderTextColor="#555"
            style={styles.formInput}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>Current Address</Text>

        {/* City */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>City *</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Mumbai"
            placeholderTextColor="#555"
            style={styles.formInput}
            autoCapitalize="words"
          />
        </View>

        {/* State */}
        <Dropdown
          label="State *"
          options={STATES}
          value={state}
          onChange={setState}
        />

        {/* Pincode */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Pincode *</Text>
          <TextInput
            value={pincode}
            onChangeText={(v) => setPincode(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="400001"
            placeholderTextColor="#555"
            style={styles.formInput}
            keyboardType="number-pad"
            maxLength={6}
          />
          {pincode.length > 0 && pincode.length !== 6 && (
            <Text style={styles.inputError}>Pincode must be 6 digits</Text>
          )}
        </View>

        {/* UAT test hint */}
        {/* <View style={styles.testCard}>
          <Text style={styles.testCardTitle}>🧪 UAT Values (confirmed REG_SUCCESS)</Text>
          <Text style={styles.testCardText}>PAN: BVYPD3824K  |  Name: MoinTest</Text>
          <Text style={styles.testCardText}>FATCA: occ_code=01, occ_type=B ✅</Text>
          <Text style={styles.testCardText}>UCC: occ=02, holding=SI, kyc=C ✅</Text>
          <Text style={styles.testCardText}>Income: 31 (Below 1L)  |  Wealth: 08</Text>
          <Text style={styles.testCardText}>Birth City: Kanbhai  |  City: MUMBAI</Text>
          <Text style={styles.testCardText}>State: AP  |  Pin: 401201</Text>
        </View> */}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorCardTitle}>⚠️ Submission Error</Text>
            <Text style={styles.errorCardText}>{error}</Text>
          </View>
        ) : null}

      </View>

      <View style={styles.buttonSection}>
        {/* Submitting progress */}
        {isSubmitting && (
          <View style={styles.progressCard}>
            <ActivityIndicator size="small" color="#6b50c4" />
            <Text style={styles.progressCardText}>{submitStep}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          style={[styles.submitButton, (!isFormValid || isSubmitting) && styles.buttonDisabled]}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Processing...' : '🚀 Complete Onboarding'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(gowealthy)/mf/onboarding/preview')}
          style={styles.devButton}
        >
          <Text style={styles.devButtonText}>Skip (Dev) →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingScreen: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#fff', fontSize: 15 },
  header: { padding: 20, paddingTop: 60 },
  backButton: { padding: 8 },
  backButtonText: { color: '#fff', fontSize: 16 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, paddingHorizontal: 20 },
  progressStepContainer: { flexDirection: 'row', alignItems: 'center' },
  progressCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  progressCircleActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4', shadowColor: '#6b50c4', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  progressCircleCompleted: { backgroundColor: '#10b981', borderColor: '#10b981' },
  progressText: { fontSize: 14, fontWeight: '600', color: '#666' },
  progressTextActive: { color: '#fff' },
  progressLine: { width: 24, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },
  questionSection: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 },
  questionTitle: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 12, textAlign: 'center' },
  questionSubtitle: { fontSize: 16, color: '#999', lineHeight: 24, textAlign: 'center' },
  formContainer: { paddingHorizontal: 20, marginBottom: 16 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 10 },
  formInput: { padding: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 15 },
  inputError: { color: '#ef4444', fontSize: 12, marginTop: 6 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  genderBtnActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4' },
  genderBtnText: { color: '#888', fontSize: 14, fontWeight: '500' },
  genderBtnTextActive: { color: '#fff' },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)' },
  chipActive: { backgroundColor: '#6b50c4', borderColor: '#6b50c4' },
  chipText: { color: '#888', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8, marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 20 },
  testCard: { backgroundColor: 'rgba(255,165,0,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,165,0,0.25)', borderRadius: 12, padding: 14, marginBottom: 16 },
  testCardTitle: { color: '#FFA500', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  testCardText: { color: '#ccc', fontSize: 13, lineHeight: 22 },
  errorCard: { backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 14, marginBottom: 16 },
  errorCardTitle: { color: '#ef4444', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  errorCardText: { color: '#fca5a5', fontSize: 13, lineHeight: 20 },
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(107,80,196,0.1)', borderRadius: 10, padding: 14, marginBottom: 12 },
  progressCardText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  buttonSection: { padding: 20, gap: 12, marginBottom: 40 },
  submitButton: { backgroundColor: '#6b50c4', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#333', opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  devButton: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center', opacity: 0.7 },
  devButtonText: { color: '#fff', fontSize: 14 },
  uatFillBtn: { backgroundColor: 'rgba(255,165,0,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,165,0,0.4)', borderRadius: 10, padding: 14, alignItems: 'center', marginHorizontal: 20, marginBottom: 20 },
  uatFillBtnText: { color: '#FFA500', fontSize: 14, fontWeight: '700' },
  uatFillSubText: { color: 'rgba(255,165,0,0.7)', fontSize: 11, marginTop: 3 },
  // ── Modal styles ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#0f0f14', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48, alignItems: 'center' },
  modalHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 24 },
  modalEmoji: { fontSize: 48, marginBottom: 12 },
  modalTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 15, color: '#999', lineHeight: 24, textAlign: 'center', marginBottom: 24 },
  modalSteps: { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16, marginBottom: 24, gap: 12 },
  modalStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalStepDone: { fontSize: 16 },
  modalStepPending: { fontSize: 16 },
  modalStepText: { fontSize: 14, color: '#ccc', fontWeight: '500' },
  modalAuthBtn: { width: '100%', backgroundColor: '#6b50c4', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  modalAuthBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalNoLink: { width: '100%', backgroundColor: 'rgba(255,165,0,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,165,0,0.3)', borderRadius: 12, padding: 14, marginBottom: 12 },
  modalNoLinkText: { color: '#FFA500', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  modalNote: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  modalDoneBtn: { width: '100%', backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  modalDoneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalDismissBtn: { paddingVertical: 8 },
  modalDismissBtnText: { color: '#555', fontSize: 13 },
  // Success state
  successContainer: { flex: 1, padding: 24, paddingTop: 80, alignItems: 'center', gap: 16 },
  successEmoji: { fontSize: 64, marginBottom: 8 },
  successTitle: { fontSize: 32, fontWeight: '700', color: '#fff', textAlign: 'center' },
  successSubtitle: { fontSize: 16, color: '#999', lineHeight: 26, textAlign: 'center' },
  successSteps: { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 20, gap: 12 },
  successStep: { fontSize: 15, color: '#fff', fontWeight: '500' },
  authButton: { width: '100%', backgroundColor: '#6b50c4', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  authButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  authNote: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20 },
  doneButton: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' },
  doneButtonText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});

export default Screen6FATCAAndUCC;