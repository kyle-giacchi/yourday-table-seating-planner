import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FIRST_RUN_NOTICE_KEY } from '@/lib/storageKeys';
import { safeLocalStorage } from '@/lib/safeStorage';

export const useFirstRunNotice = (enabled = true) => {
  const { toast } = useToast();
  useEffect(() => {
    if (!enabled) return;
    if (safeLocalStorage.getItem(FIRST_RUN_NOTICE_KEY) === 'true') return;
    safeLocalStorage.setItem(FIRST_RUN_NOTICE_KEY, 'true');
    toast({
      title: 'Your plan is saved in this browser',
      description:
        'Your event data stays on this device. Export a backup from the top nav before clearing history or switching browsers.',
      duration: 12000,
    });
  }, [enabled, toast]);
};
