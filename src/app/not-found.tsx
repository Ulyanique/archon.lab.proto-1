import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <p className="eyebrow">
        <b>404</b> {"//"} запись не найдена
      </p>
      <h1 className="page-title">Нет такой записи</h1>
      <p className="lead">
        Запрошенного материала нет в архиве либо он не опубликован (черновики и архивные записи не показываются). Попробуйте <Link href="/search">поиск</Link>.
      </p>
    </>
  );
}
