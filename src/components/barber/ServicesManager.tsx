import React, { useState } from 'react';
import { useBarber } from '../../context/BarberContext';
import { Service } from '../../types';
import { formatCurrency } from '../../utils/timeUtils';
import {
  Scissors,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Check,
  AlertCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const ServicesManager: React.FC = () => {
  const { services, addService, updateService, deleteService, toggleServiceStatus } = useBarber();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<string>('40');
  const [formDuration, setFormDuration] = useState<number>(30);
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  const durationPresets = [10, 15, 20, 25, 30, 40, 45, 60];

  const handleOpenCreateModal = () => {
    setEditingServiceId(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('35');
    setFormDuration(30);
    setFormActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setEditingServiceId(service.id);
    setFormName(service.name);
    setFormDescription(service.description || '');
    setFormPrice(String(service.price));
    setFormDuration(service.durationMinutes);
    setFormActive(service.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseFloat(formPrice.replace(',', '.'));
    if (!formName.trim()) {
      setFormError('Informe o nome do serviço.');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Informe um valor de preço válido maior que zero.');
      return;
    }

    if (formDuration < 5) {
      setFormError('A duração mínima permitida é de 5 minutos.');
      return;
    }

    if (editingServiceId) {
      updateService(editingServiceId, {
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        durationMinutes: formDuration,
        active: formActive,
      });
    } else {
      addService({
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        durationMinutes: formDuration,
        active: formActive,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase text-[#EDEDED] sm:text-3xl">
            Meus Serviços
          </h1>
          <p className="mt-1 text-xs uppercase tracking-wider text-[#666]">
            Configure os cortes, barbas, preços e durações no padrão Bento
          </p>
        </div>

        <button
          id="add-service-btn"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 self-start rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-[#D4AF37]/20 transition-all hover:brightness-110 active:scale-95 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Serviço</span>
        </button>
      </div>

      {/* Notice about duration impact */}
      <div className="rounded-xl border border-[#222] bg-[#141414] p-4 shadow-md">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-[#1A1A1A] border border-[#333] p-1.5 text-[#D4AF37]">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#EDEDED]">
              Cálculo Inteligente de Disponibilidade
            </h4>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[#888]">
              A duração configurada bloqueia exatamente os minutos necessários na sua agenda (ex: Barba de 10 min libera o próximo cliente em 10 min, enquanto Corte de 30 min bloqueia 30 min).
            </p>
          </div>
        </div>
      </div>

      {/* Services List - Bento Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {services.map((service) => {
          return (
            <div
              key={service.id}
              className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-5 transition-all shadow-lg ${
                service.active
                  ? 'border-[#222] border-l-4 border-l-[#D4AF37] bg-[#141414] hover:border-[#333]'
                  : 'border-[#222] border-l-4 border-l-[#444] bg-[#141414] opacity-50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1A1A1A] border border-[#333] text-[#D4AF37]">
                      <Scissors className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#EDEDED]">
                        {service.name}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs font-semibold text-[#D4AF37]">
                          <Clock className="h-3 w-3" />
                          {service.durationMinutes} minutos
                        </span>
                        <span className="text-[#444]">•</span>
                        <span className="text-sm font-bold text-[#EDEDED]">
                          {formatCurrency(service.price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <button
                    onClick={() => toggleServiceStatus(service.id)}
                    title={service.active ? 'Desativar serviço' : 'Ativar serviço'}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors"
                  >
                    {service.active ? (
                      <span className="flex items-center gap-1 font-bold text-[10px] uppercase text-[#22c55e]">
                        <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                        <span>Ativo</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-bold text-[10px] uppercase text-[#666]">
                        <span className="h-2 w-2 rounded-full bg-[#444]" />
                        <span>Inativo</span>
                      </span>
                    )}
                  </button>
                </div>

                {service.description && (
                  <p className="mt-3 text-xs leading-relaxed text-[#888]">
                    {service.description}
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 flex items-center justify-between border-t border-[#222] pt-3">
                <span className="text-[10px] uppercase tracking-wider text-[#666]">
                  {service.active ? 'Visível no catálogo' : 'Oculto para clientes'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(service)}
                    className="flex items-center gap-1 rounded-lg border border-[#333] bg-[#1A1A1A] px-2.5 py-1.5 text-xs font-semibold text-[#888] hover:border-[#D4AF37] hover:text-[#EDEDED]"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-[#D4AF37]" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja remover o serviço "${service.name}"?`)) {
                        deleteService(service.id);
                      }
                    }}
                    className="flex items-center rounded-lg border border-[#3b1d1d] bg-[#241414] p-1.5 text-[#f87171] hover:bg-[#3d1a1a]"
                    title="Remover serviço"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#222] bg-[#141414] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-bold uppercase tracking-wider text-[#EDEDED]">
                {editingServiceId ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#666] hover:text-[#EDEDED]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666]">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degradê, Barba Terapia, Pezinho..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-3.5 py-2.5 text-sm text-[#EDEDED] placeholder-[#555] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666]">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Lavagem, toalha quente, finalização com óleo e modelador..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-3.5 py-2 text-xs text-[#EDEDED] placeholder-[#555] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666]">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-3.5 py-2.5 text-sm font-bold text-[#EDEDED] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#666]">
                    Duração em Minutos *
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[#333] bg-[#1A1A1A] px-3.5 py-2.5 text-sm font-bold text-[#D4AF37] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Duration Presets */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#666]">
                  Atalhos de duração comum:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {durationPresets.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setFormDuration(mins)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                        formDuration === mins
                          ? 'bg-[#D4AF37] text-black font-bold'
                          : 'border border-[#333] bg-[#1A1A1A] text-[#888] hover:text-[#EDEDED]'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Toggle in form */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="form-active-checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="h-4 w-4 rounded border-[#333] bg-[#1A1A1A] text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <label htmlFor="form-active-checkbox" className="text-xs font-semibold text-[#888]">
                  Serviço Ativo (visível para agendamento pelos clientes)
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="mt-6 flex items-center justify-end gap-2 border-t border-[#222] pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#333] px-4 py-2 text-xs font-semibold text-[#888] hover:text-[#EDEDED]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#D4AF37] px-5 py-2 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 shadow-md shadow-[#D4AF37]/20"
                >
                  {editingServiceId ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
