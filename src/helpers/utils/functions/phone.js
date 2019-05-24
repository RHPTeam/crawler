module.exports = ( phone ) => {
  const regexPhoneVT = /(09[6|7|8]|03[2|3|4|5|6|7|8|9]|086)+([0-9]{7}\b)/g,
    regexPhoneVN = /(09[1|4]|08[1|2|3|4|5|8])+([0-9]{7}\b)/g,
    regexPhoneMB = /(09[0|3]|07[0|6|7|8|9]|089)+([0-9]{7}\b)/g,
    regexPhoneVNMB = /(09[2]|05[6|8])+([0-9]{7}\b)/g,
    regexPhoneGMB = /(09[9]|059)+([0-9]{7}\b)/g;

  if (
    regexPhoneVT.test( phone ) || regexPhoneVN.test( phone ) || regexPhoneMB.test( phone ) || regexPhoneVNMB.test( phone ) || regexPhoneGMB.test( phone )
  ) {
    return true;
  }
  return false;
  
};
