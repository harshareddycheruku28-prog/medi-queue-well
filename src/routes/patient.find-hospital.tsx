import { createFileRoute, Link } from '@tanstack/react-router';
import React, { useState, useMemo } from 'react';
import { hospitals, Hospital } from '@/lib/mock-data';
import { LeafletMapComponent } from '@/components/LeafletMap';
import { useTranslation } from '@/lib/i18n';

export const Route = createFileRoute('/patient/find-hospital')({
  component: FindHospitalPage,
});

function FindHospitalPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(10);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const filtered = useMemo(() => {
    return hospitals.filter((h) => {
      const matchesSearch =
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.address.toLowerCase().includes(search.toLowerCase());
      const matchesRating = h.rating >= minRating;
      const matchesDistance = h.distanceKm <= maxDistance;
      return matchesSearch && matchesRating && matchesDistance;
    });
  }, [search, minRating, maxDistance]);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #fffbeb 0%, #fef3c7 40%, #fff7ed 100%)' }}>
      {/* Page Header */}
      <header className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#92400e' }}>
            🏥 {t("find_hosp_title")}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#b45309' }}>
            {t("find_hosp_subtitle")}
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sidebar Filters ── */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="glass-card rounded-2xl p-5 sticky top-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#92400e' }}>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  🔍
                </span>
                {t("find_hosp_filters")}
              </h2>

              {/* Search */}
              <label className="block text-xs font-medium mb-1" style={{ color: '#b45309' }}>
                {t("find_hosp_search_lbl")}
              </label>
              <input
                type="text"
                placeholder={t("find_hosp_search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full mb-4 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none"
                style={{
                  background: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  color: '#92400e',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#f59e0b';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#fde68a';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />

              {/* Min Rating */}
              <label className="block text-xs font-medium mb-1" style={{ color: '#b45309' }}>
                {t("find_hosp_min_rating")}
              </label>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value) || 0)}
                  className="flex-1 accent-amber-500"
                />
                <span className="text-sm font-semibold px-2 py-0.5 rounded-lg" style={{ background: '#fef3c7', color: '#b45309' }}>
                  {minRating} ★
                </span>
              </div>

              {/* Max Distance */}
              <label className="block text-xs font-medium mb-1" style={{ color: '#b45309' }}>
                {t("find_hosp_max_distance")}
              </label>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseFloat(e.target.value) || 10)}
                  className="flex-1 accent-amber-500"
                />
                <span className="text-sm font-semibold px-2 py-0.5 rounded-lg" style={{ background: '#fef3c7', color: '#b45309' }}>
                  {maxDistance} km
                </span>
              </div>

              {/* Result Count */}
              <div className="mt-2 pt-3" style={{ borderTop: '1px solid #fde68a' }}>
                <p className="text-xs" style={{ color: '#b45309' }}>
                  {filtered.length === 1
                    ? t("find_hosp_showing_count_single")
                    : t("find_hosp_showing_count", { count: filtered.length })}
                </p>
              </div>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <section className="flex-1 min-w-0">
            {/* Map */}
            <div className="rounded-2xl overflow-hidden shadow-warm-lg mb-6" style={{ height: 340, border: '2px solid #fde68a' }}>
              <LeafletMapComponent
                hospitals={filtered}
                onHospitalClick={(h) => setSelectedHospital(h)}
              />
            </div>

            {/* Hospital Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {filtered.map((h) => (
                <HospitalCard
                  key={h.id}
                  hospital={h}
                  isSelected={selectedHospital?.id === h.id}
                  onClick={() => setSelectedHospital(h)}
                />
              ))}

              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-5xl mb-3">🏥</div>
                  <p className="text-lg font-semibold" style={{ color: '#92400e' }}>
                    {t("find_hosp_none_found")}
                  </p>
                  <p className="text-sm" style={{ color: '#b45309' }}>
                    {t("find_hosp_none_found_desc")}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ── Hospital Card ── */
function HospitalCard({
  hospital: h,
  isSelected,
  onClick,
}: {
  hospital: Hospital;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      className="glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
      style={{
        border: isSelected ? '2px solid #f59e0b' : '2px solid transparent',
        boxShadow: isSelected
          ? '0 8px 32px -8px rgba(245,158,11,0.25)'
          : '0 4px 16px -4px rgba(180,83,9,0.08)',
      }}
    >
      {/* Image with gradient overlay */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={h.imageUrl}
          alt={t(h.name)}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          onError={(e) => {
            // Fallback gradient when image is missing
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(0deg, rgba(146,64,14,0.5) 0%, transparent 60%)' }}
        />

        {/* Rating badge */}
        <div
          className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          ⭐ {h.rating}
        </div>

        {/* Emergency badge */}
        {h.emergencyAvailable && (
          <div
            className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          >
            🚨 24/7
          </div>
        )}

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <h3 className="text-lg font-bold text-white drop-shadow-md">{t(h.name)}</h3>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <p className="text-xs mb-3 flex items-center gap-1" style={{ color: '#b45309' }}>
          📍 {t(h.address)}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatBadge icon="📏" label={t("find_hosp_card_distance")} value={`${h.distanceKm} km`} />
          <StatBadge icon="👥" label={t("find_hosp_card_queue")} value={`${h.currentQueueLength}`} />
          <StatBadge icon="⏱️" label={t("find_hosp_card_wait")} value={`${h.estimatedWaitMinutes}m`} />
        </div>

        {/* Feature tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {h.pharmacy && <FeatureTag label={t("find_hosp_card_pharmacy")} />}
          {h.bloodBank && <FeatureTag label={t("find_hosp_card_blood_bank")} />}
          {h.parking && <FeatureTag label={t("find_hosp_card_parking")} />}
          {h.government && <FeatureTag label={t("find_hosp_card_govt")} />}
        </div>

        {/* Departments */}
        <div className="flex flex-wrap gap-1 mb-3">
          {h.departments.map((d) => (
            <span
              key={d}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: '#fef3c7', color: '#92400e' }}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Fee range */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #fde68a' }}>
          <span className="text-xs" style={{ color: '#b45309' }}>
            💰 ₹{h.feeRange.min} – ₹{h.feeRange.max}
          </span>
          <div className="flex gap-2">
            <Link
              to="/patient/book"
              search={{ hospitalId: h.id }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md block text-center"
              style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}
            >
              {t("find_hosp_card_btn_details")}
            </Link>
            <Link
              to="/patient/book"
              search={{ hospitalId: h.id }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md block text-center"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              {t("find_hosp_card_btn_book")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat badge sub-component ── */
function StatBadge({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="text-center rounded-xl p-2" style={{ background: '#fffbeb' }}>
      <div className="text-sm">{icon}</div>
      <div className="text-xs font-bold" style={{ color: '#92400e' }}>{value}</div>
      <div className="text-[10px]" style={{ color: '#b45309' }}>{label}</div>
    </div>
  );
}

/* ── Feature tag sub-component ── */
function FeatureTag({ label }: { label: string }) {
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: '#ecfdf5', color: '#0d9488', border: '1px solid #99f6e4' }}
    >
      {label}
    </span>
  );
}
