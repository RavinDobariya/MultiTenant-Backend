def create_cache_key(
    resource: str,
    identifier: str | int
) -> str:
    """
    Generate tenant-safe cache key
    """

    return f"key_{resource}:{identifier}"

def create_list_cache_key(
        resource: str,
        company_id: str,
        filters:dict | None = None
    ) -> str:
        """
       List / filter / pagination cache key
       """
        base = f"key_{resource}:{company_id}:list"

        if filters:
            for x in filters:               #No need to sort dictionary as latest python dict are ordered
                base += f":{x}_{filters[x]}"

        return base