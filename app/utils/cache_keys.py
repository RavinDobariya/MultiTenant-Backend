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
        page:int,
        limit:int,
        filters:dict | None = None
    ) -> str:
        """
       List / filter / pagination cache key
       """
        base = f"key_{resource}:list:page_{page}:limit_{limit}"

        if filters:
            for x in filters:               #No need to sort dictionary as latest python dict are ordered
                base += f":{x}_{filters[x]}"

        return base