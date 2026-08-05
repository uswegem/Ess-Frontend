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

const EMPTY_ADDRESS = {
  line1: '',
  line2: '',
  city: '',
  region: '',
  country: 'TZ',
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
    address: { ...EMPTY_ADDRESS },
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

  const updateAddress = (field, value) => {
    setForm((f) => ({
      ...f,
      address: { ...f.address, [field]: value },
    }));
  };

  const loadDraft = async (id) => {
    try {
      const result = await getDraft(id);
      const t = result.data?.tenant || result.data;
      setTenantId(t.tenantId || id);
      setForm((f) => ({
        ...f,
        tenantName: t.tenantName || f.tenantName,
        fspCode: t.fspCode || f.fspCode,
        contactEmail: t.contactEmail || f.contactEmail,
        contactPerson: t.contactPerson || f.contactPerson,
        contactPhone: t.contactPhone || f.contactPhone,
        fspName: t.fspName || f.fspName,
        address: {
          line1: t.address?.line1 || '',
          line2: t.address?.line2 || '',
          city: t.address?.city || '',
          region: t.address?.region || '',
          country: t.address?.country || 'TZ',
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
    const { line1, line2, city, region, country } = form.address;
    if (line1?.trim() || line2?.trim() || city?.trim() || region?.trim()) {
      companyInfo.address = {
        line1: line1?.trim() || '',
        line2: line2?.trim() || '',
        city: city?.trim() || '',
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
            updateAddress={updateAddress}
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
      <Typography variant="h5" sx={{ mb: 2 }}>FSP Onboarding</Typography>
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
