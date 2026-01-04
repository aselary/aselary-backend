export function safeUser(user) {
  if (!user) return null;

  return {
 id: newUser._id,
  fullName: newUser.fullName,
  email: newUser.email,
  phoneNumber: newUser.phoneNumber,
  accountNumber: newUser.accountNumber, // alias ONLY

    // optional
    status: user.status,
    createdAt: user.createdAt,
  };
}