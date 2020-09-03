const zeroDecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatZeroDecimals(value: number | string) {
  return zeroDecimalsFormatter.format(Number(value));
}

const twoDecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const sixDecimalsFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 6,
  maximumFractionDigits: 6,
});

const formatBNBDecimalsNumber = new Intl.NumberFormat('en-US', {
  //minimumFractionDigits: 18,
  maximumFractionDigits: 18,
});

export function formatBNBDecimals(value: number | string) {
  return formatBNBDecimalsNumber.format(Number(value) / 1e18);
}



export function formatWithTwoDecimals(value: number | string) {
  return twoDecimalsFormatter.format(Number(value));
}

export function formatWithSixDecimals(value: number | string) {
  return sixDecimalsFormatter.format(Number(value));
}

export function formatWithTwoDecimalsRub(value: number) {
  return `${formatWithTwoDecimals(value)} ₽`;
}

export function ones(value: number | string) {
  return Number(value) / 1e18;
}

export function truncateAddressString(address: string, num = 12) {
  if (!address) {
    return '';
  }

  const first = address.slice(0, num);
  const last = address.slice(-(num));
  return `${first}...${last}`;
}
