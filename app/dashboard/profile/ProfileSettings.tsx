
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function ProfileSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Error de Contraseña',
        description: 'La nueva contraseña y la confirmación no coinciden.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: 'Contraseña Débil',
        description: 'La nueva contraseña debe tener al menos 8 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Contraseña cambiada correctamente.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Error al cambiar la contraseña.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Change password failed:', error);
      toast({
        title: 'Error del Sistema',
        description: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible.')) {
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast({
          title: 'Cuenta Eliminada',
          description: 'Tu cuenta ha sido eliminada exitosamente. Serás redirigido.',
        });
        window.location.href = '/';
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Error al eliminar la cuenta.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Delete account failed:', error);
      toast({
        title: 'Error del Sistema',
        description: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold">Perfil y Estadísticas</h2>

      <div className="border-b pb-4">
        <h3 className="text-xl font-semibold mb-3">Cambiar Contraseña</h3>
        <div className="grid gap-2 mb-4 max-w-sm">
          <Label htmlFor="current-password">Contraseña Actual</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isChangingPassword}
          />
          <Label htmlFor="new-password">Nueva Contraseña</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isChangingPassword}
          />
          <Label htmlFor="confirm-new-password">Confirmar Nueva Contraseña</Label>
          <Input
            id="confirm-new-password"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            disabled={isChangingPassword}
          />
        </div>
        <Button onClick={handleChangePassword} disabled={isChangingPassword || !currentPassword || !newPassword || !confirmNewPassword}>
          {isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
        </Button>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Eliminar Cuenta</h3>
        <p className="text-sm text-red-500 mb-4">Esta acción es irreversible y eliminará todos tus datos. Procede con precaución.</p>
        <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeletingAccount}>
          {isDeletingAccount ? 'Eliminando...' : 'Eliminar Cuenta'}
        </Button>
      </div>
    </div>
  );
}
