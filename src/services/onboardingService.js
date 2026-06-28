import API from '../Api';
import { getRequest, postRequest, putRequest } from '../ApiFunction';

export const validateFspCode = (fspCode, excludeTenantId) =>
  postRequest(API.ONBOARDING_VALIDATE_FSP, { fspCode }, {
    params: excludeTenantId ? { excludeTenantId } : {},
  }).then((r) => r.data);

export const createDraft = (payload) =>
  postRequest(API.ONBOARDING_DRAFTS, payload).then((r) => r.data);

export const getDraft = (tenantId) =>
  getRequest(API.onboardingDraft(tenantId)).then((r) => r.data);

export const updateDraft = (tenantId, payload) =>
  putRequest(API.onboardingDraft(tenantId), payload).then((r) => r.data);

export const submitOnboarding = (tenantId) =>
  postRequest(API.onboardingSubmit(tenantId), {}).then((r) => r.data);

export const reviewOnboarding = (tenantId, payload) =>
  postRequest(API.onboardingReview(tenantId), payload).then((r) => r.data);
