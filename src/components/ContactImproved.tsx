import React, { useState } from 'react';
import { Phone, ArrowRight, Instagram, CheckCircle, AlertCircle } from 'lucide-react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const whatsappLink = "https://wa.me/5594981796065?text=Olá%20Óticas%20Master!%20Gostaria%20de%20agendar%20uma%20consulta.";
  const instagramLink = "https://instagram.com/oticasmaster.pbs";

  // Validação de email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validação de telefone
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$|^\d{10,11}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Telefone inválido (ex: (94) 98179-6065)';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Mensagem é obrigatória';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Mensagem deve ter pelo menos 10 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simular envio (em produção, seria uma chamada API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Construir mensagem WhatsApp
      const message = `Olá! Meu nome é ${formData.name}. ${formData.message}. Meu email é ${formData.email} e telefone ${formData.phone}`;
      const whatsappUrl = `https://wa.me/5594981796065?text=${encodeURIComponent(message)}`;
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Resetar formulário
      setFormData({ name: '', email: '', phone: '', message: '' });
      setSubmitted(true);
      
      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    } finally {
      setLoading(false);
    }
  };

  // Formatar telefone enquanto digita
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 0) {
      if (value.length <= 2) {
        value = `(${value}`;
      } else if (value.length <= 6) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
      }
    }
    
    setFormData({ ...formData, phone: value });
    if (errors.phone) {
      setErrors({ ...errors, phone: '' });
    }
  };

  return (
    <section id="contato" className="py-20 bg-gray-light">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Info Column */}
            <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-main mb-6">
                Entre em Contato
              </h2>
              <p className="text-gray-secondary mb-8 text-lg">
                Estamos prontos para ajudá-lo! Escolha a forma que preferir para falar com nossos especialistas.
              </p>
              
              <div className="space-y-4">
                <a 
                  href={whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-beige-light transition-colors border border-gray-100 group"
                  aria-label="Contatar via WhatsApp"
                >
                  <div className="bg-green-500 text-white p-3 rounded-full group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-main">WhatsApp</h3>
                    <p className="text-gray-secondary group-hover:text-gold transition-colors">(94) 98179-6065</p>
                  </div>
                  <ArrowRight className="ml-auto w-5 h-5 text-gray-300 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </a>

                <a 
                  href={instagramLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-beige-light transition-colors border border-gray-100 group"
                  aria-label="Seguir no Instagram"
                >
                  <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white p-3 rounded-full group-hover:scale-110 transition-transform">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-main">Instagram</h3>
                    <p className="text-gray-secondary group-hover:text-gold transition-colors">@oticasmaster.pbs</p>
                  </div>
                  <ArrowRight className="ml-auto w-5 h-5 text-gray-300 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </a>
              </div>
            </div>

            {/* Form Column */}
            <div className="bg-beige-light p-8 md:p-12 lg:p-16 flex flex-col justify-center relative overflow-hidden">
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#B8860B_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="relative z-10">
                <h3 className="font-serif text-2xl font-bold text-gray-main mb-6">
                  Envie uma Mensagem
                </h3>

                {submitted && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 text-sm">Mensagem enviada com sucesso!</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Nome */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-main mb-2">
                      Nome *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                      } focus:outline-none focus:ring-2 focus:ring-gold transition-all`}
                      placeholder="Seu nome"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                    {errors.name && (
                      <p id="name-error" className="mt-1 text-red-600 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-main mb-2">
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                      } focus:outline-none focus:ring-2 focus:ring-gold transition-all`}
                      placeholder="seu@email.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="mt-1 text-red-600 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Telefone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-main mb-2">
                      Telefone *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                      } focus:outline-none focus:ring-2 focus:ring-gold transition-all`}
                      placeholder="(94) 98179-6065"
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? 'phone-error' : undefined}
                    />
                    {errors.phone && (
                      <p id="phone-error" className="mt-1 text-red-600 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Mensagem */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-main mb-2">
                      Mensagem *
                    </label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (errors.message) setErrors({ ...errors, message: '' });
                      }}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        errors.message ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                      } focus:outline-none focus:ring-2 focus:ring-gold transition-all resize-none`}
                      placeholder="Sua mensagem aqui..."
                      rows={3}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                    />
                    {errors.message && (
                      <p id="message-error" className="mt-1 text-red-600 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Botão Enviar */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold hover:bg-gold-dark text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Enviar mensagem"
                  >
                    {loading ? 'Enviando...' : 'Enviar Mensagem'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
