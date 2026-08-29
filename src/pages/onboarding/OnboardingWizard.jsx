import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Stepper, Step, StepLabel, StepConnector, stepConnectorClasses, Button, Typography, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';
import {
  validateFspCode, createDraft, getDraft, updateDraft, submitOnboarding,
} from '../../services/onboardingService';
import { validateMifosConfig, getIntegrationHealth, uploadCertificates } from '../../services/tenantService';
import { createApiKey } from '../../services/apiKeyService';
import { buildMifosConfigPayload } from '../../utils/mifosConfig';
import { getPostcode } from '../../utils/tanzaniaGeo';
import CompanyInfo from '../../components/OnboardingWizard/CompanyInfo';
import MifosConfig from '../../components/OnboardingWizard/MifosConfig';
import ApiKeySetup from '../../components/OnboardingWizard/ApiKeySetup';
import ReviewStep from '../../components/OnboardingWizard/ReviewStep';
import SuccessScreen from '../../components/OnboardingWizard/SuccessScreen';

const OnboardingStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.active}, &.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderTopWidth: 2,
  },
}));

function OnboardingStepIcon({ active, completed, icon }) {
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.85rem',
        fontWeight: 600,
        bgcolor: active || completed ? 'primary.main' : 'action.disabledBackground',
        color: active || completed ? 'primary.contrastText' : 'text.secondary',
      }}
    >
      {icon}
    </Box>
  );
}

const STEPS = ['Organization', 'MIFOS Config', 'API Keys & Certificates', 'Review', 'Submit'];

// UI-only cascade state (Country -> Region -> District -> Ward -> auto-filled Post Code ->
// Address Line 1). Kept separate from `form.address` (the shape actually sent to the
// backend) because Tenant.js/tenantSchemas.js's addressSchema only has
// line1/line2/city/region/country - no district/ward/postCode - and Joi rejects unknown
// keys by default. Backend is out of scope for this change, so buildCompanyInfo() below
// maps this richer cascade down into that fixed shape instead (district -> city,
// ward+postCode -> a formatted line2) rather than sending new keys the backend would 400 on.
const EMPTY_GEO = {
  country: 'TZ',
  region: '',
  district: '',
  ward: '',
  postCode: '',
  line1: '',
};

export default function OnboardingWizard() {
  const { tenantId: routeTenantId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [tenantId, setTenantId] = useState(routeTenantId || '');
  const [fspAvailable, setFspAvailable] = useState(null);
  const [health, setHealth] = useState(null);
  const [keyModal, setKeyModal] = useState(null);
  const [certFiles, setCertFiles] = useState({ publicCert: null, privateKey: null });
  const [certsUploaded, setCertsUploaded] = useState(false);
  const [form, setForm] = useState({
    tenantName: '',
    fspCode: '',
    contactEmail: '',
    contactPerson: '',
    contactPhone: '',
    fspName: '',
    geo: { ...EMPTY_GEO },
    mifosMode: 'inherit_default',
    mifosBaseUrl: '',
    mifosTenantId: '',
    mifosUsername: '',
    mifosPassword: '',
    apiKeyName: 'Production',
  });

  useEffect(() => {
    if (routeTenantId) {
      loadDraft(routeTenantId);
    }
  }, [routeTenantId]);

  // Cascading updates: changing a parent clears every field that depends on it (approved
  // behavior change - "each dropdown cascading from its parent (changing a parent clears
  // its children)"). Post Code is never set directly by the user - it's derived from
  // region+district+ward via getPostcode() whenever ward changes.
  const updateGeoCountry = (value) => {
    setForm((f) => ({ ...f, geo: { ...EMPTY_GEO, country: value, line1: f.geo.line1 } }));
  };
  const updateGeoRegion = (value) => {
    setForm((f) => ({ ...f, geo: { ...f.geo, region: value, district: '', ward: '', postCode: '' } }));
  };
  const updateGeoDistrict = (value) => {
    setForm((f) => ({ ...f, geo: { ...f.geo, district: value, ward: '', postCode: '' } }));
  };
  const updateGeoWard = (value) => {
    setForm((f) => ({
      ...f,
      geo: { ...f.geo, ward: value, postCode: getPostcode(f.geo.region, f.geo.district, value) },
    }));
  };
  const updateGeoLine1 = (value) => {
    setForm((f) => ({ ...f, geo: { ...f.geo, line1: value } }));
  };

  // Parses buildCompanyInfo()'s own line2 encoding back out, for resuming a draft this app
  // saved. Best-effort only - a draft saved before this change (or edited by something else)
  // won't have a matching line2 format, in which case ward/postCode are just left blank and
  // the operator re-picks them; district still recovers from `city` either way.
  const parseGeoLine2 = (line2) => {
    const wardMatch = /Ward:\s*([^,]+)/.exec(line2 || '');
    const postCodeMatch = /Post Code:\s*(\S+)/.exec(line2 || '');
    return { ward: wardMatch?.[1]?.trim() || '', postCode: postCodeMatch?.[1]?.trim() || '' };
  };

  const loadDraft = async (id) => {
    try {
      const result = await getDraft(id);
      const t = result.data?.tenant || result.data;
      setTenantId(t.tenantId || id);
      const { ward, postCode } = parseGeoLine2(t.address?.line2);
      setForm((f) => ({
        ...f,
        tenantName: t.tenantName || f.tenantName,
        fspCode: t.fspCode || f.fspCode,
        contactEmail: t.contactEmail || f.contactEmail,
        contactPerson: t.contactPerson || f.contactPerson,
        contactPhone: t.contactPhone || f.contactPhone,
        fspName: t.fspName || f.fspName,
        geo: {
          country: t.address?.country || 'TZ',
          region: t.address?.region || '',
          district: t.address?.city || '',
          ward,
          postCode,
          line1: t.address?.line1 || '',
        },
        mifosMode: t.mifosConfig?.mode || f.mifosMode,
        mifosBaseUrl: t.mifosConfig?.baseUrl || f.mifosBaseUrl,
        mifosTenantId: t.mifosConfig?.tenantId || f.mifosTenantId,
        mifosUsername: t.mifosConfig?.makerUsername || f.mifosUsername,
        mifosPassword: '',
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const buildCompanyInfo = () => {
    const companyInfo = {
      tenantName: form.tenantName,
      fspCode: form.fspCode,
      fspName: form.fspName || form.tenantName,
      contactPerson: form.contactPerson,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
    };
    const { line1, region, district, ward, postCode, country } = form.geo;
    if (line1?.trim() || region?.trim() || district?.trim()) {
      // Maps the real cascade down into the backend's fixed address shape (line1/line2/
      // city/region/country - see EMPTY_GEO's comment for why). District -> city; Ward +
      // Post Code -> a formatted line2, parsed back out by parseGeoLine2() above when a
      // draft is resumed.
      const line2Parts = [];
      if (ward) line2Parts.push(`Ward: ${ward}`);
      if (postCode) line2Parts.push(`Post Code: ${postCode}`);
      companyInfo.address = {
        line1: line1?.trim() || '',
        line2: line2Parts.join(', '),
        city: district?.trim() || '',
        region: region?.trim() || '',
        country: country || 'TZ',
      };
    }
    return companyInfo;
  };

  const saveOrganization = async () => {
    const check = await validateFspCode(form.fspCode, tenantId || undefined);
    if (!check.data?.available) {
      toast.error('FSP code is not available');
      return false;
    }
    if (!tenantId) {
      const created = await createDraft({
        tenantName: form.tenantName,
        fspCode: form.fspCode,
        contactEmail: form.contactEmail,
      });
      const id = created.data?.tenant?.tenantId || created.data?.tenantId;
      setTenantId(id);
      await updateDraft(id, {
        companyInfo: buildCompanyInfo(),
        completedSteps: ['organization'],
      });
      navigate(`/onboarding/${id}`, { replace: true });
    } else {
      await updateDraft(tenantId, {
        companyInfo: buildCompanyInfo(),
        completedSteps: ['organization'],
      });
    }
    return true;
  };

  const saveMifos = async () => {
    const mifosConfig = buildMifosConfigPayload({
      mode: form.mifosMode,
      baseUrl: form.mifosBaseUrl,
      tenantId: form.mifosTenantId,
      makerUsername: form.mifosUsername,
      makerPassword: form.mifosPassword,
    });
    await updateDraft(tenantId, { mifosConfig, completedSteps: ['organization', 'mifos'] });
    const valid = await validateMifosConfig(tenantId, mifosConfig);
    if (!valid.data?.valid) {
      toast.warn(valid.data?.message || 'MIFOS validation failed — check credentials');
      return false;
    }
    toast.success('MIFOS configuration validated');
    return true;
  };

  const uploadCertsIfProvided = async () => {
    if (!certFiles.publicCert || !certFiles.privateKey) return true;
    const fd = new FormData();
    fd.append('publicCert', certFiles.publicCert);
    fd.append('privateKey', certFiles.privateKey);
    await uploadCertificates(tenantId, fd);
    setCertsUploaded(true);
    return true;
  };

  const saveApiKeysAndCerts = async () => {
    if (form.apiKeyName?.trim()) {
      const result = await createApiKey(tenantId, { name: form.apiKeyName.trim() });
      setKeyModal(result.data);
    }
    await uploadCertsIfProvided();
    await updateDraft(tenantId, { completedSteps: ['organization', 'mifos', 'api_keys', 'certificates'] });
    return true;
  };

  const loadReview = async () => {
    const h = await getIntegrationHealth(tenantId);
    setHealth(h.data);
    await updateDraft(tenantId, { completedSteps: ['organization', 'mifos', 'api_keys', 'certificates', 'review'] });
  };

  const handleSubmit = async () => {
    await submitOnboarding(tenantId);
    setSubmitted(true);
    toast.success('FSP submitted for review');
  };

  const handleNext = async () => {
    try {
      if (activeStep === 0 && !(await saveOrganization())) return;
      if (activeStep === 1 && !(await saveMifos())) return;
      if (activeStep === 2) await saveApiKeysAndCerts();
      if (activeStep === 3) await loadReview();
      if (activeStep === 4) {
        await handleSubmit();
        return;
      }
      setActiveStep((s) => s + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  if (submitted) {
    return (
      <Box sx={{ p: 3 }}>
        <SuccessScreen tenantId={tenantId} onContinue={() => navigate('/tenants')} />
      </Box>
    );
  }

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <CompanyInfo
            form={form}
            setForm={setForm}
            updateGeoCountry={updateGeoCountry}
            updateGeoRegion={updateGeoRegion}
            updateGeoDistrict={updateGeoDistrict}
            updateGeoWard={updateGeoWard}
            updateGeoLine1={updateGeoLine1}
            fspAvailable={fspAvailable}
            onCheckAvailability={async () => {
              const r = await validateFspCode(form.fspCode, tenantId);
              setFspAvailable(r.data?.available);
            }}
          />
        );
      case 1:
        return <MifosConfig form={form} setForm={setForm} />;
      case 2:
        return (
          <ApiKeySetup
            form={form}
            setForm={setForm}
            certFiles={certFiles}
            setCertFiles={setCertFiles}
            certsUploaded={certsUploaded}
          />
        );
      case 3:
        return <ReviewStep tenantId={tenantId} form={form} health={health} />;
      case 4:
        return <Alert severity="warning">Submit this FSP for platform review. You can approve it from the Tenants page.</Alert>;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.2px', mb: 2 }}>FSP Onboarding</Typography>
      <Stepper activeStep={activeStep} connector={<OnboardingStepConnector />} sx={{ mb: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel StepIconComponent={OnboardingStepIcon}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Paper sx={{ p: 3, mb: 2 }}>{renderStep()}</Paper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button disabled={activeStep === 0} onClick={() => setActiveStep((s) => s - 1)}>Back</Button>
        <Button variant="contained" onClick={handleNext}>
          {activeStep === STEPS.length - 1 ? 'Submit' : 'Next'}
        </Button>
      </Box>

      <Dialog open={Boolean(keyModal)} onClose={() => setKeyModal(null)}>
        <DialogTitle>API Key Created — Save Now</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Key: {keyModal?.rawKey}</Typography>
          <Typography variant="body2">Secret: {keyModal?.rawSecret}</Typography>
        </DialogContent>
        <DialogActions><Button variant="contained" onClick={() => setKeyModal(null)}>I have saved these</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
