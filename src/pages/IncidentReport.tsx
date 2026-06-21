import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Car,
  MapPin,
  Users,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Navigation,
  ChevronRight,
} from 'lucide-react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { useResourceStore } from '@/store/useResourceStore';
import RiskBadge from '@/components/RiskBadge';
import { faultTypes, routes } from '@/data/mockData';
import { getRiskLabel } from '@/data/mockData';

export default function IncidentReport() {
  const navigate = useNavigate();
  const { formData, setFormData, riskAssessment, calculateRisk, submitIncident } =
    useIncidentStore();
  const { resources } = useResourceStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nearestDistance = resources.filter((r) => r.status === 'available').sort((a, b) => a.distance - b.distance)[0]
    ?.distance || 5;

  useEffect(() => {
    calculateRisk(nearestDistance);
  }, [formData.studentCount, formData.isRoadOccupied, formData.faultType, nearestDistance, calculateRisk]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.plateNumber.trim()) newErrors.plateNumber = '请输入车牌号';
    if (!formData.location.trim()) newErrors.location = '请输入当前位置';
    if (formData.studentCount < 0) newErrors.studentCount = '学生人数不能为负数';
    if (!formData.faultType) newErrors.faultType = '请选择故障类型';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const incident = submitIncident();
    if (incident) {
      navigate('/resources');
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData({ [field]: value });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const riskCards = [
    {
      key: 'student',
      label: '学生滞留风险',
      level: riskAssessment?.studentRisk || 'green',
      desc: riskAssessment?.studentDesc || '等待输入...',
      icon: Users,
    },
    {
      key: 'road',
      label: '道路风险',
      level: riskAssessment?.roadRisk || 'green',
      desc: riskAssessment?.roadDesc || '等待输入...',
      icon: AlertTriangle,
    },
    {
      key: 'resource',
      label: '资源距离风险',
      level: riskAssessment?.resourceRisk || 'green',
      desc: riskAssessment?.resourceDesc || '等待输入...',
      icon: Navigation,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
            <Phone className="w-5 h-5 text-red-400" />
          </div>
          故障接报
        </h2>
        <p className="text-slate-400">接到司机故障电话后，请立即录入故障信息</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-400" />
              基本信息
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  车牌号 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.plateNumber}
                  onChange={(e) => handleInputChange('plateNumber', e.target.value)}
                  placeholder="请输入车牌号，如：京A·12345"
                  className={`w-full px-4 py-2.5 bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.plateNumber
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-slate-600/50 focus:ring-blue-500/30 focus:border-blue-500/50'
                  }`}
                />
                {errors.plateNumber && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {errors.plateNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  运营线路
                </label>
                <select
                  value={formData.route}
                  onChange={(e) => handleInputChange('route', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="">请选择线路</option>
                  {routes.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  当前位置 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="请输入故障发生的具体位置"
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      errors.location
                        ? 'border-red-500/50 focus:ring-red-500/30'
                        : 'border-slate-600/50 focus:ring-blue-500/30 focus:border-blue-500/50'
                    }`}
                  />
                </div>
                {errors.location && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {errors.location}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  车上学生人数
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="number"
                    min="0"
                    value={formData.studentCount || ''}
                    onChange={(e) =>
                      handleInputChange('studentCount', parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    人
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  故障类型 <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.faultType}
                  onChange={(e) => handleInputChange('faultType', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-900/50 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                    errors.faultType
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-slate-600/50 focus:ring-blue-500/30 focus:border-blue-500/50'
                  }`}
                >
                  <option value="">请选择故障类型</option>
                  {faultTypes.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                {errors.faultType && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {errors.faultType}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  是否占道
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleInputChange('isRoadOccupied', true)}
                    className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                      formData.isRoadOccupied
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-slate-900/50 border-slate-600/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                    是，占道停放
                  </button>
                  <button
                    onClick={() => handleInputChange('isRoadOccupied', false)}
                    className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                      !formData.isRoadOccupied
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-900/50 border-slate-600/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    否，已靠边
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              提交接报，安排救援
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div
            className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl border p-6 transition-all duration-500 ${
              riskAssessment?.overall === 'red'
                ? 'border-red-500/50 shadow-lg shadow-red-500/10'
                : riskAssessment?.overall === 'yellow'
                ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
                : riskAssessment?.overall === 'green'
                ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                : 'border-slate-700/50'
            }`}
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              综合风险评估
            </h3>

            <div className="flex flex-col items-center justify-center py-4">
              {riskAssessment ? (
                <>
                  <RiskBadge
                    level={riskAssessment.overall}
                    size="lg"
                    pulse={riskAssessment.overall === 'red'}
                  />
                  <p className="text-slate-400 text-sm mt-3">
                    当前风险等级：{getRiskLabel(riskAssessment.overall)}
                  </p>
                </>
              ) : (
                <div className="text-slate-500 text-sm">
                  请填写故障信息以评估风险
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {riskCards.map((card) => (
              <div
                key={card.key}
                className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border p-4 transition-all duration-300 ${
                  card.level === 'red'
                    ? 'border-red-500/30'
                    : card.level === 'yellow'
                    ? 'border-amber-500/30'
                    : 'border-slate-700/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      card.level === 'red'
                        ? 'bg-red-500/20'
                        : card.level === 'yellow'
                        ? 'bg-amber-500/20'
                        : 'bg-slate-700/50'
                    }`}
                  >
                    <card.icon
                      className={`w-5 h-5 ${
                        card.level === 'red'
                          ? 'text-red-400'
                          : card.level === 'yellow'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{card.label}</span>
                      <RiskBadge level={card.level} size="sm" />
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{card.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="text-slate-400 font-medium">提示：</span>
              系统将根据学生人数、是否占道、故障类型及最近资源距离自动计算风险等级，请确保信息准确。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
