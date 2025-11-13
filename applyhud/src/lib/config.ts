export function permitirMultiplesVacantes(): boolean {
  return process.env.PERMITIR_MULTIPLES_VACANTES === 'true';
}
