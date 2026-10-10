import re
import math
from typing import List, Dict, Any, Tuple


def tokenize_for_bm25(text: str) -> List[str]:
    """
    Extracts tokens suitable for lexical information retrieval:
    Preserves numbers, currency symbols, percentages, and hyphenated terms.
    """
    if not text:
        return []
    # Match words, numbers, and tokens with internal hyphens or decimals
    tokens = re.findall(r'\b[a-zA-Z0-9_\-\$%\.]{2,}\b', text.lower())
    return [t.strip('.-_') for t in tokens if len(t.strip('.-_')) >= 2]


class BM25Scorer:
    """
    BM25Okapi implementation with support for rank_bm25 or built-in fallback.
    """

    def __init__(self, corpus: List[str], k1: float = 1.5, b: float = 0.75):
        self.corpus_size = len(corpus)
        self.k1 = k1
        self.b = b
        self.tokenized_corpus = [tokenize_for_bm25(doc) for doc in corpus]
        
        self.doc_lens = [len(doc) for doc in self.tokenized_corpus]
        self.avg_doc_len = (sum(self.doc_lens) / max(1, self.corpus_size)) if self.corpus_size > 0 else 1.0

        # Term document frequency (DF)
        self.df: Dict[str, int] = {}
        for doc in self.tokenized_corpus:
            for term in set(doc):
                self.df[term] = self.df.get(term, 0) + 1

        # Inverse document frequency (IDF)
        self.idf: Dict[str, float] = {}
        for term, freq in self.df.items():
            # Standard Lucene / Okapi IDF with smoothing
            self.idf[term] = math.log(1.0 + (self.corpus_size - freq + 0.5) / (freq + 0.5))

    def get_scores(self, query: str) -> List[float]:
        """Calculates BM25 score for query against all documents in corpus."""
        query_tokens = tokenize_for_bm25(query)
        if not query_tokens or self.corpus_size == 0:
            return [0.0] * self.corpus_size

        scores: List[float] = [0.0] * self.corpus_size

        for term in query_tokens:
            if term not in self.idf:
                continue
            idf_val = self.idf[term]

            for doc_idx, doc_tokens in enumerate(self.tokenized_corpus):
                # Count term frequency in doc
                tf = doc_tokens.count(term)
                if tf == 0:
                    continue

                doc_len = self.doc_lens[doc_idx]
                numerator = tf * (self.k1 + 1.0)
                denominator = tf + self.k1 * (1.0 - self.b + self.b * (doc_len / max(1.0, self.avg_doc_len)))
                scores[doc_idx] += idf_val * (numerator / denominator)

        return scores
