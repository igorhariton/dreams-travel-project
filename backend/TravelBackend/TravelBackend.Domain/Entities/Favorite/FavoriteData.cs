using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TravelBackend.Domain.Entities.Favorite
{
    public class FavoriteData
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int UserId { get; set; }

        [Required]
        [StringLength(30)]
        public string ListingType { get; set; } = string.Empty;

        public int ListingId { get; set; }

        public bool IsDeleted { get; set; }

        [DataType(DataType.Date)]
        public DateTime CreatedAt { get; set; }
    }
}
