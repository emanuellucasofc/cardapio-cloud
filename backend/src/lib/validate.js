function isValidPhoneBR(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

function cleanPhone(phone) {
  return (phone || "").replace(/\D/g, "");
}

module.exports = { isValidPhoneBR, cleanPhone };
