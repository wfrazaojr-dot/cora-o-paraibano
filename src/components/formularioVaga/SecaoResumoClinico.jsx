export default function SecaoResumoClinico({ paciente }) {
  if (!paciente) return null;

  const tm = paciente.triagem_medica || {};
  const ac = paciente.avaliacao_clinica || {};
  const it = ac.info_transporte || {};

  const hasContent = Object.keys(tm).length > 0 || Object.keys(ac).length > 0;
  if (!hasContent) return null;

  return (
    <div>
      <h3 className="text-base font-bold mb-3 border-b pb-2 text-blue-900">RESUMO CLÍNICO</h3>
      <div className="space-y-4">

        {/* Sinais Vitais */}
        {Object.keys(tm).length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Sinais Vitais</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {tm.pa_braco_esquerdo && <div><span className="font-semibold text-gray-600">PA (MSE):</span> <span>{tm.pa_braco_esquerdo}</span></div>}
              {tm.pa_braco_direito && <div><span className="font-semibold text-gray-600">PA (MSD):</span> <span>{tm.pa_braco_direito}</span></div>}
              {tm.frequencia_cardiaca && <div><span className="font-semibold text-gray-600">FC:</span> <span>{tm.frequencia_cardiaca} bpm</span></div>}
              {tm.frequencia_respiratoria && <div><span className="font-semibold text-gray-600">FR:</span> <span>{tm.frequencia_respiratoria} irpm</span></div>}
              {tm.temperatura && <div><span className="font-semibold text-gray-600">Temp:</span> <span>{tm.temperatura} °C</span></div>}
              {tm.spo2 && <div><span className="font-semibold text-gray-600">SpO2:</span> <span>{tm.spo2}%</span></div>}
              {tm.glicemia_capilar && <div><span className="font-semibold text-gray-600">Glicemia:</span> <span>{tm.glicemia_capilar} mg/dL</span></div>}
              {tm.diabetes !== undefined && <div><span className="font-semibold text-gray-600">DM:</span> <span>{tm.diabetes ? "Sim" : "Não"}</span></div>}
              {tm.dpoc !== undefined && <div><span className="font-semibold text-gray-600">DPOC:</span> <span>{tm.dpoc ? "Sim" : "Não"}</span></div>}
            </div>
          </div>
        )}

        {/* Avaliação Clínica */}
        {(ac.antecedentes || ac.quadro_atual || ac.hipotese_diagnostica || ac.heart_score?.total) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-blue-700 mb-2 uppercase tracking-wide">Avaliação Clínica</h4>
            <div className="space-y-2 text-sm">
              {ac.antecedentes && <div><span className="font-semibold text-gray-700">Antecedentes:</span> <span className="text-gray-800">{ac.antecedentes}</span></div>}
              {ac.quadro_atual && <div><span className="font-semibold text-gray-700">Quadro Atual:</span> <span className="text-gray-800">{ac.quadro_atual}</span></div>}
              {ac.hipotese_diagnostica && <div><span className="font-semibold text-gray-700">Hipótese Diagnóstica:</span> <span className="text-gray-800">{ac.hipotese_diagnostica}</span></div>}
              {ac.heart_score?.total > 0 && (
                <div className="mt-2 bg-blue-100 border border-blue-300 rounded p-2">
                  <span className="font-bold text-blue-800">HEART Score: {ac.heart_score.total} pontos</span>
                  {ac.heart_score.interpretacao && <span className="text-blue-700 ml-2">— {ac.heart_score.interpretacao}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prescrição */}
        {ac.prescricao_medicamentos?.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-green-700 mb-2 uppercase tracking-wide">Prescrição</h4>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-green-100">
                  <th className="border border-green-300 px-2 py-1 text-left text-xs">Medicamento</th>
                  <th className="border border-green-300 px-2 py-1 text-left text-xs">Dose</th>
                  <th className="border border-green-300 px-2 py-1 text-left text-xs">Via</th>
                </tr>
              </thead>
              <tbody>
                {ac.prescricao_medicamentos.map((med, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-green-50"}>
                    <td className="border border-green-200 px-2 py-1 text-xs">{med.medicamento || med.nome || "—"}</td>
                    <td className="border border-green-200 px-2 py-1 text-xs">{med.dose || "—"}</td>
                    <td className="border border-green-200 px-2 py-1 text-xs">{med.via || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Exames Solicitados */}
        {ac.exames_solicitados?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-yellow-700 mb-2 uppercase tracking-wide">Exames Solicitados e Resultados</h4>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="border border-yellow-300 px-2 py-1 text-left text-xs">Exame</th>
                  <th className="border border-yellow-300 px-2 py-1 text-left text-xs">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {ac.exames_solicitados.map((exame, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-yellow-50"}>
                    <td className="border border-yellow-200 px-2 py-1 text-xs">{exame}</td>
                    <td className="border border-yellow-200 px-2 py-1 text-xs">{ac.resultados_exames?.[exame] || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ac.observacoes_exames && (
              <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                {ac.observacoes_exames.exames_nao_realizados && <p>• Exames não realizados</p>}
                {ac.observacoes_exames.exames_nao_liberados && <p>• Exames não liberados até o momento</p>}
                {ac.observacoes_exames.outros && <p>• Outros: {ac.observacoes_exames.outros}</p>}
              </div>
            )}
          </div>
        )}

        {/* Informações para Transporte */}
        {Object.keys(it).length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-orange-700 mb-2 uppercase tracking-wide">Informações para Transporte</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {it.glasgow && <div><span className="font-semibold text-gray-600">Glasgow:</span> <span>{it.glasgow}</span></div>}
              {it.ar_ambiente !== undefined && <div><span className="font-semibold text-gray-600">Ar Ambiente:</span> <span>{it.ar_ambiente ? "Sim" : "Não"}</span></div>}
              {it.cateter_nasal !== undefined && <div><span className="font-semibold text-gray-600">Cateter Nasal:</span> <span>{it.cateter_nasal ? "Sim" : "Não"}</span></div>}
              {it.mascara_o2 !== undefined && <div><span className="font-semibold text-gray-600">Máscara O₂:</span> <span>{it.mascara_o2 ? "Sim" : "Não"}</span></div>}
              {it.vm_ativo !== undefined && <div><span className="font-semibold text-gray-600">Ventilação Mecânica:</span> <span>{it.vm_ativo ? "Sim" : "Não"}</span></div>}
              {it.vm_ativo && it.vm_modo && <div><span className="font-semibold text-gray-600">Modo VM:</span> <span>{it.vm_modo}</span></div>}
              {it.vm_ativo && it.vm_fr && <div><span className="font-semibold text-gray-600">FR VM:</span> <span>{it.vm_fr} ipm</span></div>}
              {it.vm_ativo && it.vm_peep && <div><span className="font-semibold text-gray-600">PEEP:</span> <span>{it.vm_peep} cmH₂O</span></div>}
              {it.vm_ativo && it.vm_fio2 && <div><span className="font-semibold text-gray-600">FiO₂:</span> <span>{it.vm_fio2}%</span></div>}
              {it.analgesia_sedacao !== undefined && <div><span className="font-semibold text-gray-600">Analgesia/Sedação:</span> <span>{it.analgesia_sedacao ? "Sim" : "Não"}</span></div>}
              {it.analgesia_sedacao && it.analgesia_drogas?.length > 0 && (
                <div className="col-span-2 md:col-span-3"><span className="font-semibold text-gray-600">Drogas Sedação:</span> <span>{it.analgesia_drogas.join(", ")}</span></div>
              )}
              {it.dva !== undefined && <div><span className="font-semibold text-gray-600">DVA:</span> <span>{it.dva ? "Sim" : "Não"}</span></div>}
              {it.dva && it.dva_drogas?.length > 0 && (
                <div className="col-span-2 md:col-span-3"><span className="font-semibold text-gray-600">Drogas DVA:</span> <span>{it.dva_drogas.join(", ")}</span></div>
              )}
              {it.marcapasso_transcutaneo !== undefined && <div><span className="font-semibold text-gray-600">Marcapasso Transcutâneo:</span> <span>{it.marcapasso_transcutaneo ? "Sim" : "Não"}</span></div>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}