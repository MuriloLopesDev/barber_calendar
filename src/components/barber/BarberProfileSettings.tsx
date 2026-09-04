import React, { useState } from 'react';
import { useBarber } from '../../context/BarberContext';
import {
  User,
  Phone,
  MapPin,
  Star,
  Share2,
  RefreshCw,
  Check,
  ExternalLink,
  ShieldCheck,
  Scissors,
} from 'lucide-react';

export const BarberProfileSettings: React.FC = () => {
  const { barber, updateBarberProfile, resetToDefaults, setActiveRole } = useBarber();

  const [name, setName] = useState(barber.name);
  const [phone, setPhone] = useState(barber.phone);
  const [specialty, setSpecialty] = useState(barber.specialty);
  const [bio, setBio] = useState(barber.bio);
  const [address, setAddress] = useState(barber.address);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBarberProfile({
      name,
      phone,
      specialty,
      bio,
      address,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar os dados originais da demonstração (Lucas Martins, serviços e agendamentos padrão)?')) {
      resetToDefaults();
      setName('Lucas Martins');
      setPhone('(11) 98765-4321');
      setSpecialty('Especialista em cortes masculinos & navalha');
      setBio('Especialista em cortes masculinos contemporâneos e barba tradicional navalhada. Toalha quente, alinhamento facial e produtos premium.');
      setAddress('Rua Augusta, 1420 - Consolação, São Paulo - SP');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="font-brand text-2xl font-extrabold tracking-wide text-[#f1f3f5] sm:text-3xl">
          Perfil da Barbearia
        </h1>
        <p className="mt-1 text-xs text-[#8e9aa8]">
          Informações públicas exibidas para os clientes na página de agendamento online
        </p>
      </div>

      {/* Public Link Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#c59b27]/30 bg-gradient-to-r from-[#171b26] via-[#141822] to-[#12151e] p-5 shadow-lg">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#c59b27]">
              <Share2 className="h-3.5 w-3.5" />
              Link de Agendamento dos Clientes
            </span>
            <h3 className="text-base font-bold text-[#f8fafc]">
              Compartilhe com seus clientes no WhatsApp ou Instagram
            </h3>
            <p className="text-xs text-[#9aa5b6]">
              Ao abrir este link, seus clientes visualizam apenas horários livres calculados pela duração de cada serviço.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl border border-[#2c374a] bg-[#1a212f] px-3.5 py-2 text-xs font-semibold text-[#cbd5e1] hover:text-[#f8fafc]"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#22c55e]" /> : <Share2 className="h-3.5 w-3.5 text-[#c59b27]" />}
              <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              onClick={() => setActiveRole('client')}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#c59b27] to-[#a88220] px-4 py-2 text-xs font-bold text-[#0c0e13] hover:brightness-110"
            >
              <span>Abrir como Cliente</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-[#242c3b] bg-[#121620] p-5 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#9aa5b6]">
          Dados do Barbeiro
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#8e9aa8]">
              Nome Profissional
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#273142] bg-[#161a25] px-3.5 py-2.5 text-sm text-[#f1f3f5] focus:border-[#c59b27] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8e9aa8]">
              WhatsApp / Telefone Comercial
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#273142] bg-[#161a25] px-3.5 py-2.5 text-sm text-[#f1f3f5] focus:border-[#c59b27] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#8e9aa8]">
            Especialidade / Subtítulo
          </label>
          <input
            type="text"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#273142] bg-[#161a25] px-3.5 py-2.5 text-sm text-[#f1f3f5] focus:border-[#c59b27] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#8e9aa8]">
            Biografia / Descrição da Barbearia
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#273142] bg-[#161a25] px-3.5 py-2.5 text-xs text-[#f1f3f5] focus:border-[#c59b27] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#8e9aa8]">
            Endereço da Barbearia
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#273142] bg-[#161a25] px-3.5 py-2.5 text-sm text-[#f1f3f5] focus:border-[#c59b27] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between border-t border-[#202735] pt-4">
          {saved ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-[#22c55e]">
              <Check className="h-4 w-4" />
              <span>Salvo com sucesso!</span>
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-[#c59b27] to-[#a88220] px-5 py-2.5 text-xs font-bold text-[#0c0e13] shadow-md shadow-[#c59b27]/20 hover:brightness-110"
          >
            Salvar Perfil
          </button>
        </div>
      </form>

      {/* System Reset Section */}
      <div className="rounded-2xl border border-[#3b1d1d] bg-[#1e1111]/40 p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-[#f87171]">
              Restaurar Demonstração Original
            </h3>
            <p className="text-xs text-[#a37070]">
              Recarrega os dados padrão descritos no briefing (Lucas Martins, 4 serviços, horários e agendamentos fictícios).
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 self-start rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Restaurar Dados</span>
          </button>
        </div>
      </div>
    </div>
  );
};
