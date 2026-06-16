import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Shield, Building2, UserPlus, Trash2, Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { useAuth, UserRole, AllowedStaffEntry, Facility, TaminiProfile } from '../context/AuthContext';

export default function StaffManagement() {
  const {
    inviteStaff,
    revokeStaffAccess,
    getAllowedStaff,
    getFacilities,
    getPendingWorkerRequests,
    approveWorkerRequest,
    rejectWorkerRequest,
    getFacilityStaff,
    removeWorker
  } = useAuth();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('caregiver');
  const [facilityId, setFacilityId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [staffList, setStaffList] = useState<AllowedStaffEntry[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TaminiProfile[]>([]);
  const [activeStaff, setActiveStaff] = useState<TaminiProfile[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingList(true);
    setPendingLoading(true);
    setStaffLoading(true);

    const [staffRes, facRes, pendingRes, activeRes] = await Promise.all([
      getAllowedStaff(),
      getFacilities(),
      getPendingWorkerRequests(),
      getFacilityStaff()
    ]);

    if (staffRes.data) setStaffList(staffRes.data);
    if (facRes.data) {
      setFacilities(facRes.data);
      if (!facRes.data.some(f => f.id === facilityId) && facRes.data.length > 0) {
        setFacilityId(facRes.data[0].id);
      }
    }
    if (pendingRes.data) setPendingRequests(pendingRes.data);
    if (activeRes.data) setActiveStaff(activeRes.data);

    setLoadingList(false);
    setPendingLoading(false);
    setStaffLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Veuillez saisir une adresse email.');
      return;
    }
    if (!facilityId) {
      setError('Veuillez sélectionner un établissement.');
      return;
    }

    try {
      setInviting(true);
      const result = await inviteStaff(email.trim(), role, facilityId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(`Invitation envoyée à ${email.trim()}`);
      setEmail('');
      await loadData();
    } catch (err) {
      console.error('Invite error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      setRevokingId(id);
      const result = await revokeStaffAccess(id);

      if (result.error) {
        setError(result.error);
        return;
      }

      setStaffList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Revoke error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionId(id);
      const result = await approveWorkerRequest(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPendingRequests(prev => prev.filter(req => req.id !== id));
      await loadData();
    } catch (err) {
      console.error('Approve error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionId(id);
      const result = await rejectWorkerRequest(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPendingRequests(prev => prev.filter(req => req.id !== id));
    } catch (err) {
      console.error('Reject error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setActionId(null);
    }
  };

  const handleRemoveWorker = async (id: string) => {
    try {
      setRevokingId(id);
      const result = await removeWorker(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setActiveStaff(prev => prev.filter(staff => staff.id !== id));
    } catch (err) {
      console.error('Remove worker error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setRevokingId(null);
    }
  };

  const getFacilityName = (id: string) => {
    return facilities.find(f => f.id === id)?.name ?? id.slice(0, 8) + '...';
  };

  const roleBadge = (r: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-50 text-purple-700',
      caregiver: 'bg-emerald-50 text-emerald-700',
    };
    const labels: Record<string, string> = {
      admin: 'Admin',
      caregiver: 'Aidant',
    };
    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${styles[r] ?? 'bg-slate-50 text-slate-700'}`}>
        {labels[r] ?? r}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase mb-4">
          Administration
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight title-serif">
          Gestion du personnel
        </h1>
        <p className="text-lg text-slate-500 mt-2">
          Invitez des membres du personnel et gérez les accès à votre établissement.
        </p>
      </div>

      {/* Invitation Form */}
      <motion.form
        onSubmit={handleInvite}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-[3rem] p-8 md:p-12 premium-shadow border border-slate-100 space-y-8"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-2xl">
            <UserPlus size={24} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 title-serif">Inviter un membre</h2>
            <p className="text-sm text-slate-500">Ajoutez un administrateur ou un aidant à votre établissement, ou gérez les demandes en attente.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Adresse email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Rôle</label>
            <div className="relative">
              <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="caregiver">Aidant</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>

          {/* Facility */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Établissement</label>
            <div className="relative">
              <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
              <select
                value={facilityId}
                onChange={e => setFacilityId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="">Sélectionner...</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-800"
          >
            <CheckCircle2 size={18} className="shrink-0" />
            {success}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={inviting}
          className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-8 py-4 rounded-2xl font-bold text-base hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-lg shadow-indigo-600/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {inviting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Invitation en cours...
            </>
          ) : (
            <>
              <UserPlus size={20} />
              Envoyer l'invitation
            </>
          )}
        </button>
      </motion.form>

      {/* Whitelist Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-[3rem] p-8 md:p-12 premium-shadow border border-slate-100 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 title-serif">Membres invités</h2>
            <p className="text-sm text-slate-500">
              {staffList.length} invitation{staffList.length !== 1 ? 's' : ''} en attente
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loadingList}
            className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
          >
            Actualiser
          </button>
        </div>

        {loadingList ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-slate-50 rounded-full inline-flex mb-4">
              <UserPlus size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Aucune invitation pour le moment</p>
            <p className="text-slate-400 text-sm mt-1">Invitez des membres du personnel pour commencer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-4 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left py-4 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Rôle</th>
                  <th className="text-left py-4 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Établissement</th>
                  <th className="text-right py-4 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(entry => (
                  <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-3 font-medium text-slate-900">{entry.email}</td>
                    <td className="py-4 px-3">{roleBadge(entry.role)}</td>
                    <td className="py-4 px-3 text-slate-700">{getFacilityName(entry.facility_id)}</td>
                    <td className="py-4 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRevoke(entry.id)}
                        disabled={revokingId === entry.id}
                        className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 font-semibold text-xs px-3 py-2 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
                      >
                        {revokingId === entry.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Révoquer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pending worker requests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-white rounded-[3rem] p-8 md:p-12 premium-shadow border border-slate-100 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 title-serif">Demandes en attente</h2>
            <p className="text-sm text-slate-500">
              {pendingRequests.length} demande{pendingRequests.length !== 1 ? 's' : ''} en attente
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={pendingLoading}
            className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
          >
            Actualiser
          </button>
        </div>

        {pendingLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-slate-50 rounded-full inline-flex mb-4">
              <Shield size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Aucune demande en attente</p>
            <p className="text-slate-400 text-sm mt-1">Les travailleurs peuvent s'inscrire et attendre l'approbation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-4 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left py-4 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Rôle</th>
                  <th className="text-left py-4 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(request => (
                  <tr key={request.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-3 font-medium text-slate-900">{request.email}</td>
                    <td className="py-4 px-3">{roleBadge(request.role)}</td>
                    <td className="py-4 px-3 text-right flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleReject(request.id)}
                        disabled={actionId === request.id}
                        className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 font-semibold text-xs px-3 py-2 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
                      >
                        {actionId === request.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Rejeter
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(request.id)}
                        disabled={actionId === request.id}
                        className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-semibold text-xs px-3 py-2 rounded-xl hover:bg-emerald-50 transition-all disabled:opacity-50"
                      >
                        {actionId === request.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Approuver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Active staff */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-[3rem] p-8 md:p-12 premium-shadow border border-slate-100 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 title-serif">Personnel actif</h2>
            <p className="text-sm text-slate-500">
              {activeStaff.length} membre{activeStaff.length !== 1 ? 's' : ''} actif{activeStaff.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={staffLoading}
            className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
          >
            Actualiser
          </button>
        </div>

        {staffLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : activeStaff.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-slate-50 rounded-full inline-flex mb-4">
              <Shield size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Aucun membre actif</p>
            <p className="text-slate-400 text-sm mt-1">Invitez un personnel pour commencer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-4 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Nom / Email</th>
                  <th className="text-left py-4 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Rôle</th>
                  <th className="text-left py-4 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Établissement</th>
                  <th className="text-right py-4 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeStaff.map(staff => (
                  <tr key={staff.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-3 font-medium text-slate-900">{staff.full_name || staff.email}</td>
                    <td className="py-4 px-3">{roleBadge(staff.role)}</td>
                    <td className="py-4 px-3 text-slate-700">{staff.facility_id ? getFacilityName(staff.facility_id) : '—'}</td>
                    <td className="py-4 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveWorker(staff.id)}
                        disabled={revokingId === staff.id}
                        className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 font-semibold text-xs px-3 py-2 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
                      >
                        {revokingId === staff.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
