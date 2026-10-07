/** Эзэмшигчийн өгсөн түр нууц үгээр орж ирсэн хэрэглэгч анх нэвтрэхдээ нууц үгээ солих ёстой */
export function mustChangePassword(claims: { user_metadata?: unknown }): boolean {
  return (claims.user_metadata as { must_change_password?: boolean } | undefined)?.must_change_password === true;
}
