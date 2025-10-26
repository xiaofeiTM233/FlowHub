import Link from 'next/link';

const itemRender = (route: any, params: any, routes: any[], paths: string[]) => {
  const path = `/${paths.join('/')}`;
  const isLast = routes.indexOf(route) === routes.length - 1;
  return isLast ? (
    <b>{route.title}</b>
  ) : (
    <Link href={path}>{route.title}</Link>
  );
};

export default itemRender;