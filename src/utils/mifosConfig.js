export function buildMifosConfigPayload({ mode, baseUrl, tenantId, makerUsername, makerPassword }) {
  if (mode !== 'override') {
    return { mode: 'inherit_default' };
  }

  const payload = {
    mode: 'override',
    baseUrl,
    tenantId,
    makerUsername,
    checkerUsername: makerUsername,
  };

  if (makerPassword) {
    payload.makerPassword = makerPassword;
    payload.checkerPassword = makerPassword;
  }

  return payload;
}

export function mifosConfigFromTenant(mifosConfig = {}) {
  return {
    mode: mifosConfig.mode || 'inherit_default',
    baseUrl: mifosConfig.baseUrl || '',
    tenantId: mifosConfig.tenantId || '',
    makerUsername: mifosConfig.makerUsername || '',
    makerPassword: '',
  };
}
