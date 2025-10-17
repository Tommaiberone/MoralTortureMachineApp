import { useEffect } from 'react';
import PropTypes from 'prop-types';
import './AdSense.css';

/**
 * Componente per mostrare annunci Google AdSense
 *
 * @param {string} client - ID client AdSense (es: "ca-pub-XXXXXXXXXXXXXXXX")
 * @param {string} slot - ID slot dell'annuncio
 * @param {string} format - Formato dell'annuncio (auto, rectangle, vertical, horizontal)
 * @param {boolean} responsive - Se true, l'annuncio si adatta al contenitore
 * @param {string} style - Stili CSS inline per il contenitore
 */
const AdSense = ({
  client = import.meta.env.VITE_ADSENSE_CLIENT || '',
  slot,
  format = 'auto',
  responsive = true,
  style = {}
}) => {
  useEffect(() => {
    // Verifica se lo script AdSense è già caricato
    if (window.adsbygoogle && client && slot) {
      try {
        // Push dell'annuncio nella coda di AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('Errore nel caricamento dell\'annuncio AdSense:', error);
      }
    }
  }, [client, slot]);

  // Non mostrare l'annuncio se mancano i parametri necessari
  if (!client || !slot) {
    console.warn('AdSense: client o slot mancante. Configura VITE_ADSENSE_CLIENT nelle variabili d\'ambiente.');
    return null;
  }

  return (
    <div className="adsense-container" style={{ textAlign: 'center', margin: '20px 0', ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
};

AdSense.propTypes = {
  client: PropTypes.string,
  slot: PropTypes.string.isRequired,
  format: PropTypes.oneOf(['auto', 'rectangle', 'vertical', 'horizontal', 'fluid']),
  responsive: PropTypes.bool,
  style: PropTypes.object,
};

export default AdSense;
