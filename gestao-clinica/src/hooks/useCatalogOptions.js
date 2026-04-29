import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { readErrorMessage } from '@/lib/api';

export function useCatalogOptions(path) {
  const { apiFetch } = useAuth();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await apiFetch(path);
        if (!response.ok) {
          throw new Error(await readErrorMessage(response, 'Falha ao carregar o catálogo.'));
        }

        const payload = await response.json();
        if (!Array.isArray(payload)) {
          throw new Error('Formato inesperado retornado pelo servidor.');
        }

        const nextOptions = payload
          .filter(
            (item) =>
              item &&
              typeof item.codigo === 'string' &&
              typeof item.nome === 'string',
          )
          .map((item) => ({
            codigo: item.codigo,
            nome: item.nome,
          }));

        if (!active) return;
        setOptions(nextOptions);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Falha ao carregar o catálogo.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [apiFetch, path, reloadToken]);

  const reload = () => {
    setReloadToken((value) => value + 1);
  };

  return {
    options,
    items: useMemo(
      () =>
        options.map((item) => ({
          value: item.codigo,
          label: item.nome,
        })),
      [options],
    ),
    loading,
    error,
    reload,
  };
}
