import {
  AtmPageHeader,
  AtmPageShell,
} from '@/components/layout/atm-page-shell';
import { MasukanForm } from '@/components/masukan/masukan-form';

export const metadata = {
  title: 'Masukan',
  description:
    'Kirim saran, kritik, atau temuan ke SPPG Penarukan 2 — kami dengarkan setiap suara dari siswa, guru, dan orang tua.',
};

export default function MasukanPage() {
  return (
    <div className='mx-auto max-w-2xl px-4 py-8'>
      <AtmPageShell theme='masukan'>
        <MasukanForm>
          <AtmPageHeader
            theme='masukan'
            emoji='💬'
            title='Ceritakan ke Kami'
            description='Punya saran, kritik, atau temuan? Tulis di sini — kami dengarkan setiap suara dari siswa, guru, dan orang tua.'
          />
        </MasukanForm>
      </AtmPageShell>
    </div>
  );
}
